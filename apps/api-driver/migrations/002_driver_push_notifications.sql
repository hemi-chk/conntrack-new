alter table public.drivers
  add column if not exists expo_push_token text;

create index if not exists drivers_expo_push_token_idx
  on public.drivers (expo_push_token)
  where expo_push_token is not null;
