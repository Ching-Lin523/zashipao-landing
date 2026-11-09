-- 唯讀盤點，僅管理者使用，不新增、修改或刪除任何場次。
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'sessions'
order by ordinal_position;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid = 'public.sessions'::regclass;

select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c where c.oid = 'public.sessions'::regclass;

select policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'sessions';

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'sessions'
order by grantee, privilege_type;

select s.id, s.title,
       s.starts_at at time zone 'Asia/Taipei' as taiwan_starts_at,
       s.ends_at at time zone 'Asia/Taipei' as taiwan_ends_at,
       s.capacity, s.is_published, count(b.id) as booked_count
from public.sessions s left join public.bookings b on b.session_id = s.id
where s.ends_at > now()
group by s.id, s.title, s.starts_at, s.ends_at, s.capacity, s.is_published
order by s.starts_at
limit 100;
-- 這是查詢當下的快照，不是安全修改授權，不能防止查完後有人預約。
