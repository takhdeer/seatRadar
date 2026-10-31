Server gotchas

Critical Banner debugging note: The "stuck on first result" symptom from Banner's searchResults endpoint is not caused by JSESSIONID session locking, MRU cookie rotation (MRUB9SSBPRODREGHA rotates per-request as anti-replay), or X-Synchronizer-Token chaining. The actual fix is a POST to the resetDataForm endpoint (empty body, same cookies) before every new searchResults call. Do not re-chase cookie/token rotation theories for this class of symptom.
node-cron dead code path: When runEngineRetry returns 'Failed' instead of throwing, the catch block in the scheduler never fires for retry exhaustion — handle the return value explicitly
