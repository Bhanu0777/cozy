-- COZY minimal schema. Run in the Supabase SQL editor.
create table if not exists rooms (
  id uuid primary key,
  room_code text not null unique,
  room_name text not null,
  max_users int not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  display_name text not null,
  mood text not null default 'happy',
  online boolean not null default false,
  token_hash text not null,           -- sha256 of the session token; the token itself is never stored
  joined_at timestamptz not null default now()
);
create index if not exists sessions_room_idx on sessions(room_id);

create table if not exists messages (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  sender_id uuid not null references sessions(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_room_idx on messages(room_id, created_at);

-- Only the COZY server (service-role key) touches these tables.
-- RLS on with no policies = the anon key can read/write nothing.
alter table rooms enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
