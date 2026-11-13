import { agentRouter } from "../features/agent/router";
import { aiProvidersRouter } from "../features/ai-providers/router";
import { aiRouter } from "../features/ai/router";
import { applicationsRouter } from "../features/applications/router";
import { authRouter } from "../features/auth/router";
import { billingRouter } from "../features/billing/router";
import { careerRouter } from "../features/career/router";
import { coverLettersRouter } from "../features/cover-letters/router";
import { documentsRouter } from "../features/documents/router";
import { financeRouter } from "../features/finance/router";
import { flagsRouter } from "../features/flags/router";
import { githubRouter } from "../features/github/router";
import { invoiceRouter } from "../features/invoice/router";
import { quotaRouter } from "../features/quota/router";
import { resumeRouter } from "../features/resume/router";
import { statisticsRouter } from "../features/statistics/router";
import { storageRouter } from "../features/storage/router";
import { supportRouter } from "../features/support/router";
import { usageRouter } from "../features/usage/router";
import { webAccessRouter } from "../features/web-access/router";

export default {
	ai: aiRouter,
	aiProviders: aiProvidersRouter,
	agent: agentRouter,
	applications: applicationsRouter,
	auth: authRouter,
	billing: billingRouter,
	career: careerRouter,
	coverLetters: coverLettersRouter,
	documents: documentsRouter,
	finance: financeRouter,
	flags: flagsRouter,
	github: githubRouter,
	invoice: invoiceRouter,
	quota: quotaRouter,
	resume: resumeRouter,
	statistics: statisticsRouter,
	storage: storageRouter,
	support: supportRouter,
	usage: usageRouter,
	webAccess: webAccessRouter,
};
