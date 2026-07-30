-- Run this on your Supabase Postgres (pgvector extension required)
create extension if not exists vector;

create table categories (
    id uuid default gen_random_uuid() primary key,
    category_id varchar(100) not null,
    display_title varchar(255) not null,
    search_slug varchar(255) not null,
    first_person_affirmation text not null,

    gospel_reference varchar(255) not null,
    gospel_text text not null,
    psalm_reference varchar(255) not null,
    psalm_text text not null,
    epistle_reference varchar(255) not null,
    epistle_text text not null,
    old_testament_reference varchar(255) not null,
    old_testament_text text not null,

    theological_author varchar(255) not null,
    theological_credentials varchar(255) not null,
    theological_quote text not null,
    pastoral_author varchar(255) not null,
    pastoral_credentials varchar(255) not null,
    pastoral_quote text not null,
    guided_prayer text not null,

    crisis_override_required boolean default false,
    is_ai_generated boolean default false,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index on categories using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_categories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)returns table (
  id uuid, category_id varchar, display_title varchar, search_slug varchar,
  first_person_affirmation text, gospel_reference varchar, gospel_text text,
  psalm_reference varchar, psalm_text text, epistle_reference varchar, epistle_text text,
  old_testament_reference varchar, old_testament_text text, theological_author varchar,
  theological_credentials varchar, theological_quote text, pastoral_author varchar,
  pastoral_credentials varchar, pastoral_quote text, guided_prayer text,
  crisis_override_required boolean, similarity float
)language sql stable as $$
  select id, category_id, display_title, search_slug,
         first_person_affirmation, gospel_reference, gospel_text,
         psalm_reference, psalm_text, epistle_reference, epistle_text,
         old_testament_reference, old_testament_text, theological_author,
         theological_credentials, theological_quote, pastoral_author,
         pastoral_credentials, pastoral_quote, guided_prayer,
         crisis_override_required, 1 - (categories.embedding <=> query_embedding) as similarity
  from categories
  where 1 - (categories.embedding <=> query_embedding) > match_threshold
  order by categories.embedding <=> query_embedding asc
  limit match_count;
$$;
