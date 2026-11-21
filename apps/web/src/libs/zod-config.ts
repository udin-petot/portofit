import z from "zod";

// The served CSP has no 'unsafe-eval', so zod's object parser would probe Function() on the first parse, get blocked,
// and fall back to the interpreted path anyway. Declaring it here skips the probe, so no CSP violation is logged.
z.config({ jitless: true });
