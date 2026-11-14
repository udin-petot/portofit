import type { BankCategory, BankLevel, BankQuestion } from "./practice-bank";

/**
 * English copy for the curated bank. The Indonesian entries stay the source of truth for ids and categories;
 * this file only replaces the words shown to an English reader.
 */
export const PRACTICE_BANK_EN: Record<string, Pick<BankQuestion, "text" | "why" | "rubric" | "followUps">> = {
	"umum-proyek-bangga": {
		text: "Tell me about the project you're proudest of. What was your role, and how did you measure the result?",
		why: "Tests whether you can state your role, own the work, and measure outcomes instead of listing technologies.",
		rubric: [
			"Describes the situation and goal briefly, without circling.",
			"Makes your own role clear: what you did versus the team's contribution.",
			"Gives a concrete measure of the result (time, errors, users, cost), not just 'it worked'.",
			"Ends with a lesson or a decision you changed after the project.",
		],
		followUps: ["If you did it again, what would you do differently?", "Which part was hardest, and why?"],
	},
	"umum-konflik": {
		text: "Tell me about a technical disagreement with a teammate. How did you resolve it?",
		why: "Looks at how you handle disagreement without putting others down, and whether decisions rest on evidence.",
		rubric: [
			"Focuses on the problem and the decision, not on the teammate's character.",
			"States both sides fairly.",
			"Names a concrete resolution: data, a small experiment, or an agreed compromise.",
			"Shows the result and a working relationship that stayed healthy.",
		],
		followUps: ["What do you do if the teammate still disagrees?", "Who made the final call?"],
	},
	"umum-tugas-baru": {
		text: "You're given a task you've never done before, with one week to deliver. What do you do?",
		why: "Tests how you learn quickly, break down a problem, and ask for help before it's too late.",
		rubric: [
			"Breaks the task into parts you can do and test.",
			"Names the learning sources you'd use (docs, existing code, someone who knows more).",
			"Describes how you'd validate your understanding along the way, not only at the end.",
			"Is honest about limits and how you'd communicate risk to your manager.",
		],
		followUps: ["How do you know you understand enough to start?", "What if it clearly won't be done in a week?"],
	},
	"umum-kegagalan": {
		text: "Tell me about your biggest project failure. What did you learn, and what changed afterwards?",
		why: "Tests honesty, ownership of mistakes, and whether the lesson actually changed how you work.",
		rubric: [
			"Admits your own mistake instead of hiding behind outside factors.",
			"Explains the real impact and how you stopped the damage.",
			"Describes a process change that survived after the incident.",
			"Doesn't pick a 'fake failure' that is really a humblebrag.",
		],
		followUps: ["Who was affected, and how did you tell them?", "How do you keep the same thing from happening again?"],
	},
	"umum-kenapa-posisi": {
		text: "Why are you interested in this role, and how do you judge whether it fits?",
		why: "Checks whether you've read the role and the company, or are applying in bulk.",
		rubric: [
			"Mentions something specific about the role or product, not generic praise.",
			"Connects your experience to what the role needs.",
			"Names an area you still need to learn, honestly.",
			"Asks a relevant question back about the team or the work.",
		],
		followUps: ["Which part of this role would challenge you most?", "What do you expect from a direct manager?"],
	},
	"backend-sql-nosql": {
		text: "Explain the difference between SQL and NoSQL, and when you'd choose each.",
		why: "Tests your understanding of data models and trade-offs, not memorised database names.",
		rubric: [
			"Explains the difference in data model and consistency, not just 'tables vs documents'.",
			"Gives real examples: financial transactions versus content whose shape keeps changing.",
			"Acknowledges that scale isn't the only reason to choose NoSQL.",
			"Can explain the operational consequences (migrations, queries, cost).",
		],
		followUps: [
			"What if the data needs relations but the volume is large?",
			"What's hardest when migrating between models?",
		],
	},
	"backend-desain-api": {
		text: "How would you design one API used by both a mobile app and the web app?",
		why: "Tests design decisions around different clients, versions, and network failure.",
		rubric: [
			"Keeps a stable contract: versioning, error format, consistent naming.",
			"Covers pagination, filters, and field selection for different clients.",
			"Separates authentication and authorisation from business logic.",
			"Plans changes that don't break old clients (deprecation, versioning).",
		],
		followUps: [
			"How do you handle clients still on an old version?",
			"Where do you put logic that differs between mobile and web?",
		],
	},
	"backend-url": {
		text: "What happens from the moment you type a URL until the page appears?",
		why: "Tests your understanding of the request chain and whether you can choose the right depth for the role.",
		rubric: [
			"Gives the order: DNS, connection, TLS, HTTP request, server, response, render.",
			"Names where each stage can fail or slow down.",
			"Doesn't stop at 'the browser sends a request'; explains the server and caches.",
			"Goes deeper on the part relevant to the role (e.g. caching, load balancing).",
		],
		followUps: ["Where does caching matter most?", "What changes if the site uses a CDN?"],
	},
	"backend-pembayaran": {
		text: "How do you handle a payment that fails midway through the process?",
		why: "Tests idempotency, status consistency, and reconciliation with a third party.",
		rubric: [
			"Keeps transaction status explicit; nothing is ever 'half done'.",
			"Makes retries safe with an idempotency key.",
			"Reconciles with the payment provider instead of trusting callbacks alone.",
			"Gives the user a clear status and never charges twice.",
		],
		followUps: ["How do you handle a callback that arrives twice?", "What if the provider is down during checkout?"],
	},
	"frontend-ssr-csr": {
		text: "Explain SSR, SSG, and CSR, and when you'd choose each.",
		why: "Tests how you weigh SEO, load time, and complexity, not short definitions.",
		rubric: [
			"Explains where the HTML is built and what that means for first paint and SEO.",
			"Uses real cases: a marketing page versus a dashboard that needs user data.",
			"Understands the costs: servers, caching, and hydration.",
			"Doesn't claim one approach is always better.",
		],
		followUps: [
			"Which page in your last project did you render on the server, and why?",
			"What usually goes wrong during hydration?",
		],
	},
	"frontend-performa": {
		text: "How do you keep a page fast as components and data keep growing?",
		why: "Tests whether you measure before optimising and understand the cost of JavaScript.",
		rubric: [
			"Measures first: Lighthouse, Web Vitals, or a profiler, not a guess.",
			"Names real strategies: code splitting, lazy loading, targeted memoisation, data caching.",
			"Separates bundle-size problems from rendering problems.",
			"Sets a performance budget and monitors it after release.",
		],
		followUps: ["Which metrics do you watch after release?", "When does memoisation make things worse?"],
	},
	"frontend-state": {
		text: "How do you manage state in a fairly large React app?",
		why: "Tests whether you can separate local state, server state, and global state without piling on libraries.",
		rubric: [
			"Separates server state (query cache) from local UI state.",
			"Explains when global state is truly necessary.",
			"Avoids duplicate sources of truth.",
			"Names the consequences: re-renders, debugging, and team onboarding.",
		],
		followUps: [
			"When do you choose Context over a state library?",
			"How do you avoid prop drilling without making everything global?",
		],
	},
	"frontend-layout": {
		text: "A layout breaks at only one screen size. How do you find and fix it?",
		why: "Tests a systematic debugging process and the habit of preventing regressions.",
		rubric: [
			"Reproduces it first with a clear viewport and device.",
			"Uses DevTools to find the element and CSS rule responsible.",
			"Fixes the root cause instead of adding random overrides.",
			"Adds a regression check after the fix.",
		],
		followUps: [
			"How do you test breakpoints without a physical device?",
			"What if the bug only appears in one browser?",
		],
	},
	"data-validasi": {
		text: "How do you make sure the numbers in an analysis can be trusted?",
		why: "Tests care with metric definitions, data quality, and conclusion bias.",
		rubric: [
			"States the data source and metric definition explicitly.",
			"Runs sanity checks against a reference number or the raw data.",
			"Names possible bias: sampling, missing data, incomparable periods.",
			"Separates correlation from causation.",
		],
		followUps: ["How do you handle missing data?", "When do you run an experiment instead of historical analysis?"],
	},
	"data-indeks": {
		text: "Explain how a database index works and when an index makes things slower.",
		why: "Tests understanding of data structures and write cost, not just 'add an index to make it fast'.",
		rubric: [
			"Explains an index as an ordered structure that speeds up certain lookups.",
			"Names the costs: storage and write/update time.",
			"Knows an index is unused when the query doesn't match or selectivity is low.",
			"Can read an execution plan to confirm the index is used.",
		],
		followUps: ["How do you choose column order in a composite index?", "When is a partial index the better choice?"],
	},
	"data-anomali": {
		text: "A dashboard number drops 30% overnight. How do you investigate?",
		why: "Tests your order of investigation: data pipeline, definitions, then the business reality.",
		rubric: [
			"Checks the pipeline and data freshness before concluding the business is broken.",
			"Compares with another source and smaller segments.",
			"Separates a real drop from a definition or tracking change.",
			"Communicates findings with an honest level of confidence.",
		],
		followUps: ["If the data is correct, what next?", "How do you stop the same panic from repeating?"],
	},
	"qa-otomatis-manual": {
		text: "How do you decide what to test automatically and what to test manually?",
		why: "Tests risk-based prioritisation and cost awareness, not a chase for 100% coverage.",
		rubric: [
			"Prioritises critical flows and regressions that are expensive to miss.",
			"Weighs change frequency and the maintenance cost of tests.",
			"Explains when manual exploration is worth more (UX, odd cases).",
			"Defines when a test should be deleted or rewritten.",
		],
		followUps: ["Which tests have given you the most value?", "How do you handle flaky tests?"],
	},
	"qa-login": {
		text: "List the test scenarios for a login feature.",
		why: "Tests completeness of thought: happy path, invalid input, security, and accessibility.",
		rubric: [
			"Happy path: correct credentials, session created, correct redirect.",
			"Negative cases: wrong password, no account, empty input, repeated attempts.",
			"Security: rate limits, error messages that don't leak accounts, session expiry.",
			"Accessibility and experience: focus, labels, readable error messages.",
		],
		followUps: ["How do you test 'forgot password'?", "What do you check after a successful login?"],
	},
	"qa-produksi": {
		text: "A bug is found in production. What's your first step?",
		why: "Tests calmness, mitigation priority, and the habit of learning from incidents.",
		rubric: [
			"Assesses impact and scope before fixing.",
			"Mitigates quickly (rollback, feature flag) before finding the root cause.",
			"Reproduces and records evidence, then fixes with a test that prevents recurrence.",
			"Writes a blameless postmortem.",
		],
		followUps: ["When do you choose rollback over a hotfix?", "Who do you tell first?"],
	},
	"karier-gaji": {
		text: "What are your salary expectations?",
		why: "Tests market research and whether you can explain a number with reasons, not guess.",
		rubric: [
			"Gives a range based on market research and the role level.",
			"Explains total compensation: base, allowances, bonus, equity.",
			"Stays open to discussion without reflexively lowering the number.",
			"Asks for the range the company has budgeted when possible.",
		],
		followUps: ["What if the offer is below your range?", "Which components besides salary matter to you?"],
	},
	"karier-dua-tawaran": {
		text: "You have two job offers. How do you decide?",
		why: "Tests career priorities and whether you can judge a job holistically, not only by the number.",
		rubric: [
			"Sets criteria before comparing: learning, manager, stability, compensation.",
			"Judges team quality through questions during interviews, not assumptions.",
			"Considers risks: probation, workload, promotion path.",
			"Explains the decision with consistent reasons.",
		],
		followUps: ["What won't you sacrifice?", "How do you verify the company's claims before accepting?"],
	},
	"karier-rencana": {
		text: "What's your plan for the next two to three years?",
		why: "Looks for a realistic direction and whether this role makes sense for that goal.",
		rubric: [
			"Shows a clear direction without being rigid.",
			"Connects the plan to the role you're applying for.",
			"Names skills you want to deepen and how you'll do it.",
			"Doesn't answer 'become a manager' without a reason.",
		],
		followUps: [
			"If this role can't provide that path, what will you do?",
			"Who do you admire professionally, and why?",
		],
	},
};

export const BANK_CATEGORY_EN: Record<BankCategory, string> = {
	"Umum & perilaku": "General & behavioural",
	Backend: "Backend",
	Frontend: "Frontend",
	Data: "Data",
	"QA & testing": "QA & testing",
	"Negosiasi & karier": "Negotiation & career",
};

export const BANK_LEVEL_EN: Record<BankLevel, string> = {
	Dasar: "Basic",
	Menengah: "Intermediate",
	Lanjut: "Advanced",
};
