-- Run AFTER creating Vault secrets job_board_project_url and job_board_refresh_secret.
-- The same 32+ character refresh secret must be set on the Edge Function.
-- This narrow window processes up to 100 companies once daily, then publishes.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule(jobid) from cron.job where jobname='career-job-board-daily';
select cron.schedule('career-job-board-daily','* 4-5 * * *', $schedule$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='job_board_project_url') || '/functions/v1/refresh-jobs',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-job-board-secret',(select decrypted_secret from vault.decrypted_secrets where name='job_board_refresh_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) where exists(select 1 from public.jb_settings where id and enabled);
$schedule$);
