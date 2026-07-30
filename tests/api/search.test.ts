import { POST } from '../../src/app/api/search/route';

describe('API /api/search', () => {
  it('returns 400 when missing query', async () => {
    const req = new Request('http://localhost/api/search', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing query');
  });

  it('returns crisis override for crisis keyword', async () => {
    const req = new Request('http://localhost/api/search', { method: 'POST', body: JSON.stringify({ query: 'I want to hurt myself' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    const json = await res.json();
    expect(json.crisis).toBe(true);
    expect(json.hotline.text).toBeDefined();
  });

  it('returns generated payload when no supabase present', async () => {
    const req = new Request('http://localhost/api/search', { method: 'POST', body: JSON.stringify({ query: 'I am overwhelmed about work' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    const json = await res.json();
    // fallback generator produces first_person_affirmation in mock
    expect(json.generated || json.first_person_affirmation).toBeDefined();
  });
});
