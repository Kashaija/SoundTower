import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const CRISIS_KEYWORDS = [
  'suicide', 'hurt myself', 'kill myself', 'abuse', 'domestic violence', 'rape', 'harm myself'
];

function containsCrisis(text: string) {
  const t = text.toLowerCase();
  return CRISIS_KEYWORDS.some(k => t.includes(k));
}

// Mock deterministic embedding (for local dev/testing if OpenAI not configured).
async function getEmbedding(text: string): Promise<number[]> {
  if (openai) {
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return resp.data[0].embedding as number[];
  }
  // deterministic pseudo-embedding: char code distribution into 1536 dims
  const dims = 1536;
  const vec = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = i % dims;
    vec[idx] += text.charCodeAt(i) / 255;
  }
  // normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

// Build system prompt per PRD.
function buildSystemPrompt(): string {
  return `You are a highly structured backend JSON generator for a faith-based inspirational web application.
Output ONLY valid JSON in this exact schema:
{
  "first_person_affirmation": string,
  "canonical_scriptures": {
    "1_gospel": { "reference": string, "text": string },
    "2_psalm": { "reference": string, "text": string },
    "3_epistle": { "reference": string, "text": string },
    "4_old_testament": { "reference": string, "text": string }
  },
  "theological_quote": { "author": string, "credentials": string, "quote": string },
  "pastoral_quote": { "author": string, "credentials": string, "quote": string },
  "guided_prayer": string
}
Follow the PRD constraints: gospel, psalm, epistle (Romans->Jude), old testament (not Psalms). Keep language gentle and pastoral.
`;
}

async function callLLMGenerate(userInput: string) {
  const systemPrompt = buildSystemPrompt();
  if (openai) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User input: ${userInput}` }
      ],
      max_tokens: 800,
      temperature: 0.2
    });
    const text = completion.choices?.[0]?.message?.content;
    try {
      return JSON.parse(text || '{}');
    } catch (e) {
      // If LLM didn't produce valid JSON, wrap in error
      return { error: 'LLM produced invalid JSON', raw: text };
    }
  } else {
    // Deterministic mock generation for local dev/tests
    return {
      first_person_affirmation: `I see you; I am with you in your ${userInput}.`,
      canonical_scriptures: {
        "1_gospel": { reference: "John 14:1", text: "Do not let your heart be troubled..." },
        "2_psalm": { reference: "Psalm 23:1", text: "The LORD is my shepherd..." },
        "3_epistle": { reference: "Romans 8:28", text: "We know that all things work together..." },
        "4_old_testament": { reference: "Isaiah 41:10", text: "Do not fear, for I am with you..." }
      },
      theological_quote: {
        author: "C.S. Lewis",
        credentials: "Theologian & Author",
        quote: "God whispers to us in our pleasures, speaks in our conscience, but shouts in our pains..."
      },
      pastoral_quote: {
        author: "Timothy Keller",
        credentials: "Pastor",
        quote: "God is most glorified in us when we are most satisfied in him."
      },
      guided_prayer: `Lord, I bring my ${userInput} to you...`
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query: string = (body.query || '').trim();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const crisis = containsCrisis(query);

    const embedding = await getEmbedding(query);

    // If Supabase configured, call the match_categories RPC
    if (supabase) {
      const rpcArg = { query_embedding: embedding, match_threshold: 0.1, match_count: 10 };
      // supabase-js marshalling: pass vector as array
      const { data, error } = await supabase.rpc('match_categories', rpcArg).select();
      if (error) {
        console.error('Supabase RPC error', error);
      } else if (Array.isArray(data) && data.length > 0) {
        // Map similarity and check top similarity
        const results = data as any[];
        const top = results[0];
        const topSim = top.similarity ?? 0;
        if (topSim >= 0.85) {
          return NextResponse.json({ crisis, results: results.map(r => ({ ...r })) });
        }
        // else below threshold -> fallback to LLM
      }
    }

    // Fallback to LLM generator
    const generated = await callLLMGenerate(query);
    // Save-back to DB if supabase present (and not crisis)
    if (supabase && !crisis) {
      try {
        // insert as is — map to columns. For prototype we insert minimal fields.
        await supabase.from('categories').insert({
          category_id: `auto-${Date.now()}`,
          display_title: (generated?.canonical_scriptures?.["1_gospel"]?.reference ?? 'Generated'),
          search_slug: query.substring(0, 64),
          first_person_affirmation: generated.first_person_affirmation ?? '',
          gospel_reference: generated.canonical_scriptures?.["1_gospel"]?.reference ?? '',
          gospel_text: generated.canonical_scriptures?.["1_gospel"]?.text ?? '',
          psalm_reference: generated.canonical_scriptures?.["2_psalm"]?.reference ?? '',
          psalm_text: generated.canonical_scriptures?.["2_psalm"]?.text ?? '',
          epistle_reference: generated.canonical_scriptures?.["3_epistle"]?.reference ?? '',
          epistle_text: generated.canonical_scriptures?.["3_epistle"]?.text ?? '',
          old_testament_reference: generated.canonical_scriptures?.["4_old_testament"]?.reference ?? '',
          old_testament_text: generated.canonical_scriptures?.["4_old_testament"]?.text ?? '',
          theological_author: generated.theological_quote?.author ?? '',
          theological_credentials: generated.theological_quote?.credentials ?? '',
          theological_quote: generated.theological_quote?.quote ?? '',
          pastoral_author: generated.pastoral_quote?.author ?? '',
          pastoral_credentials: generated.pastoral_quote?.credentials ?? '',
          pastoral_quote: generated.pastoral_quote?.quote ?? '',
          guided_prayer: generated.guided_prayer ?? '',
          is_ai_generated: true,
          embedding: embedding
        });
      } catch (e) {
        console.error('Insert error (non-fatal):', e);
      }
    }

    // Crisis override includes hotline info as required.
    if (crisis) {
      return NextResponse.json({
        crisis: true,
        hotline: {
          text: "If you are in immediate danger or at risk of harming yourself, please contact local emergency services right away. In the US, call 988 for the Suicide & Crisis Lifeline. National Domestic Violence Hotline: 1-800-799-SAFE (7233), SMS: LOVEIS to 22522.",
        }
      });
    }

    return NextResponse.json({ crisis: false, generated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
