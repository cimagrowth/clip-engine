-- Optional pg_cron + pg_net schedule for Campaign Scout.
-- Preferred on hosted Supabase: scheduled Edge Functions in supabase/config.toml
--   scout-fetch  = 0 * * * *   (top of every hour)
--   scout-briefs = 15 * * * *  (15 minutes past every hour)
--
-- Apply this migration only if you want the database to invoke the functions
-- itself. Replace the three placeholders before running:
--   {{PROJECT_URL}}  e.g. https://YOUR_PROJECT_REF.supabase.co
--   {{CRON_SECRET}}  same value as the CRON_SECRET function secret
--
-- Requires extensions pg_cron and pg_net (available on hosted Supabase).

do $$
begin
  create extension if not exists pg_cron;
  create extension if not exists pg_net;
exception
  when others then
    raise notice 'pg_cron/pg_net not available in this database: %', sqlerrm;
end;
$$;

-- Uncomment after substituting placeholders:
--
-- select cron.unschedule(jobid)
-- from cron.job
-- where jobname in ('clip-engine-scout-fetch', 'clip-engine-scout-briefs');
--
-- select cron.schedule(
--   'clip-engine-scout-fetch',
--   '0 * * * *',
--   $$
--   select net.http_post(
--     url := '{{PROJECT_URL}}/functions/v1/scout-fetch',
--     headers := jsonb_build_object(
--       'content-type', 'application/json',
--       'authorization', 'Bearer {{CRON_SECRET}}',
--       'x-cron-secret', '{{CRON_SECRET}}'
--     ),
--     body := '{"source":"pg_cron"}'::jsonb
--   );
--   $$
-- );
--
-- select cron.schedule(
--   'clip-engine-scout-briefs',
--   '15 * * * *',
--   $$
--   select net.http_post(
--     url := '{{PROJECT_URL}}/functions/v1/scout-briefs',
--     headers := jsonb_build_object(
--       'content-type', 'application/json',
--       'authorization', 'Bearer {{CRON_SECRET}}',
--       'x-cron-secret', '{{CRON_SECRET}}'
--     ),
--     body := '{"source":"pg_cron"}'::jsonb
--   );
--   $$
-- );

select 1;
