create table public.nova_video_submissions (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(btrim(title)) between 1 and 100),
 channel text not null check (length(btrim(channel)) between 1 and 40),
 category text not null check (category in ('生活','动画','游戏','科技','音乐','摄影','知识','其他')),
 src text not null unique check (length(src) <= 2000 and src ~* '^https://[^/@:[:space:]]+(:[0-9]+)?/[^[:space:]]+\.(mp4|webm|mov)([?#].*)?$'),
 thumbnail text not null default '' check (length(thumbnail) <= 2000 and (thumbnail='' or thumbnail ~ '^https://[^/@:[:space:]]+(:[0-9]+)?/[^[:space:]]*$')),
 description text not null default '' check (length(description) <= 1000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
alter table public.nova_video_submissions enable row level security;
revoke all on public.nova_video_submissions from anon, authenticated;
grant select on public.nova_video_submissions to anon, authenticated;
grant insert (id,title,channel,category,src,thumbnail,description) on public.nova_video_submissions to anon, authenticated;
grant all on public.nova_video_submissions to service_role;
create policy "Visitors submit pending videos" on public.nova_video_submissions for insert to anon, authenticated with check (status='pending');
create policy "Only approved videos are public" on public.nova_video_submissions for select to anon, authenticated using (status='approved');
create index nova_video_submissions_status_created_idx on public.nova_video_submissions(status,created_at desc);
comment on table public.nova_video_submissions is 'NOVA visitor submissions. Set status to approved or rejected in Supabase Table Editor; only approved videos are public.';
notify pgrst, 'reload schema';
