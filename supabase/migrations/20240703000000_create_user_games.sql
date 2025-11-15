create extension if not exists "uuid-ossp";

create table if not exists public.user_games (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid null,
  rawg_id integer not null,
  slug text not null,
  title text not null,
  platforms text[] default array[]::text[],
  cover_image text,
  released date,
  rawg_rating numeric,
  rawg_ratings_count integer,
  rawg_playtime integer,
  ownership text not null default 'none',
  status text not null default 'not_started',
  personal_rating integer,
  playtime_hours integer default 0,
  last_played_at timestamptz,
  notes text,
  genres text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_games_rawg_user_key
  on public.user_games (rawg_id, user_id);

create index if not exists user_games_status_idx on public.user_games (status);
create index if not exists user_games_ownership_idx on public.user_games (ownership);
create index if not exists user_games_rawg_idx on public.user_games (rawg_id);

create function public.set_user_games_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_games_set_updated_at
  before update on public.user_games
  for each row execute procedure public.set_user_games_updated_at();
