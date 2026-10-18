begin;

create table public.tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id bigint not null check (id > 0 and id <= 9007199254740991),
  title text not null check (char_length(trim(title)) > 0),
  deadline date,
  first_noticed date not null default current_date,
  completed boolean not null default false,
  archived boolean not null default false,
  priority boolean not null default false,
  note text,
  sort_order integer,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

create policy "Users read their own tasks"
on public.tasks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own tasks"
on public.tasks for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users update their own tasks"
on public.tasks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users delete their own tasks"
on public.tasks for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
