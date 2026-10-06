insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('nova-submission-videos','nova-submission-videos',true,52428800,array['video/mp4','video/webm','video/quicktime']);
create policy "Visitors upload new NOVA video files" on storage.objects
for insert to anon, authenticated
with check (
 bucket_id='nova-submission-videos'
 and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm|mov)$'
);

