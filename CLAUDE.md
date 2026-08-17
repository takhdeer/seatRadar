Purpose & context

Takh is a CS student building SeatRadar, a full-stack course seat availability tracker for Mount Royal University (MRU). The project serves dual purposes: practical utility for MRU students and a portfolio/interview piece. Takh is deliberately rebuilding from an earlier vibe-coded version into a clean, well-understood monorepo — explicitly choosing to rewrite rather than copy existing code.

Stack: React/Vite frontend (JSX, partially TSX), Node.js/Express backend (~80% plain JS, some TS for RMP routes), PostgreSQL via Supabase using raw pg driver on port 6543 (not Supabase SDK), Playwright for browser automation, Recharts for data visualization, Postmark for email notifications. Repo: takhdeer/seatRadar on GitHub.

Current state

Core engine architecture is largely in place:

Scraping engine (core-engine.js) runs as a separate long-lived process from Express, scheduled via server/engine/scheduler.js using node-cron with hand-rolled exponential backoff retry logic (no Redis/BullMQ dependency)
Cookie management: Singleton cookies table (id always = 1) storing jsession, mru, and sync_token; hybrid proactive/reactive refresh strategy (15-minute threshold + on-failure detection); Playwright runs server-side since Banner cookies are anonymous
Data layer: course_data table with upsert logic, professors table with unique constraint on (course_id, section_id, prof), user_courses join table with notified boolean for deduplication, Postmark email notifications
Auth: Supabase Auth with anonClient/adminClient separation; requireAuth Express middleware; React ProtectedRoute/PublicOnlyRoute components using onAuthStateChange with cleanup; email confirmation flow via anonClient.auth.signUp() with emailRedirectTo

Known bugs/debt to be aware of:

Bearer token not yet wired to client-side fetch/axios calls to Express
supabaseClient.auth.setSession() not yet called on client after login
Internal API key protection for scraper-facing course_data route still outstanding
Confirmation of which Express routes (profRatings, profCourses, getData, getCourse) require requireAuth is pending


Key learnings & principles

Critical Banner debugging note: The "stuck on first result" symptom from Banner's searchResults endpoint is not caused by JSESSIONID session locking, MRU cookie rotation (MRUB9SSBPRODREGHA rotates per-request as anti-replay), or X-Synchronizer-Token chaining. The actual fix is a POST to the resetDataForm endpoint (empty body, same cookies) before every new searchResults call. Do not re-chase cookie/token rotation theories for this class of symptom.
Supabase Auth: adminClient.createUser() does not trigger confirmation emails regardless of project settings — the mailer only fires on the anonClient.auth.signUp() path. Supabase returns a decoy user object with identities: [] for duplicate email signups (enumeration protection), which can cause FK violations downstream if not handled.
Recurring bug patterns to watch: CommonJS/ESM mixing; destructuring mismatches across return branches; const scoping inside try blocks; missing await producing Promise {pending}; forEach not supporting async/await (use Promise.all + .map()); || vs && in multi-condition exclusion checks; useEffect hooks called conditionally or after early returns; navigate() in render body instead of inside useEffect; useEffect cleanup returned from nested inner function instead of top-level callback
^ vs **: Bitwise XOR is not exponentiation in JavaScript — a bug caught in the retry logic
node-cron dead code path: When runEngineRetry returns 'Failed' instead of throwing, the catch block in the scheduler never fires for retry exhaustion — handle the return value explicitly

Approach & patterns

Error questions: explain the cause only — do not provide the fix unless separately asked
y/n: prefixed prompts: answer strictly yes/no ("Yes" with no explanation; "No" with brief summary, not just "No")
Skip basic CS explanations (syntax, loops, installs) unless a deep dive is explicitly requested
Never repeat previously stated instructions back to takh — just say "see above" to save tokens
Prefers short, direct answers for simple questions; and "why" explanations before implementation details

Tools & resources

Backend: Node.js/Express, pg (raw driver), node-cron, Playwright, Postmark, rate-my-professor-api-ts (patched for missing .js extension bug)
Frontend: React/Vite, React Router, Recharts, Supabase JS client
Database: Supabase (PostgreSQL, port 6543 connection string)
Dev tooling: concurrently, nodemon, bun, ts-node, TypeScript 5.x (not 7.x — incompatible with ts-node due to Go-based compiler)
Target system: MRU Banner 9 SSB (ban9ssb-prod.mtroyal.ca), Ellucian Banner


Project Structure: 
client/
    node_modules/
    public/
    src/
        components/
            Dashboard.css
            Dashbaord.jsx
            Landing.css 
            Landing.jsx (login page)
            ProtectedRoute.jsx
            PublicRoute.jsx
            SignUp.jsx
            tracked.jsx
            TrackForm.css
            TrackForm.jsx
        tests/
        utils/
            supabaseClient.js
            validation.js
    .env
    .gitignore
node_modules/
server/
    engine/
        cookieExpiration.js
        core-engine.js
        fetchCourseData.js
        fetchTrackedCourses.js
        getUserEmails.js
        runEngineRetry.js
        schedule.js
        setNotifiedFlag.js
    middleware/
    node_modules/
    patches/
    routes/
    utils/
        anonClient.js
        cookieExtract.js
        resetBanner.js
        scrapper.js
        sendEmail.js
        serviceRoleClient.js
        .env