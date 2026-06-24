import { adminClient } from "@/lib/auth";

export const adminOverview = () => adminClient.get("/admin/overview").then((r) => r.data);

export const adminListArticles = () => adminClient.get("/admin/articles").then((r) => r.data);
export const adminCreateArticle = (p) => adminClient.post("/admin/articles", p).then((r) => r.data);
export const adminUpdateArticle = (id, p) => adminClient.put(`/admin/articles/${id}`, p).then((r) => r.data);
export const adminDeleteArticle = (id) => adminClient.delete(`/admin/articles/${id}`).then((r) => r.data);

export const adminListCases = () => adminClient.get("/admin/cold-cases").then((r) => r.data);
export const adminCreateCase = (p) => adminClient.post("/admin/cold-cases", p).then((r) => r.data);
export const adminUpdateCase = (id, p) => adminClient.put(`/admin/cold-cases/${id}`, p).then((r) => r.data);
export const adminDeleteCase = (id) => adminClient.delete(`/admin/cold-cases/${id}`).then((r) => r.data);

export const adminListTips = (status) =>
  adminClient.get("/admin/tips", { params: status ? { status } : {} }).then((r) => r.data);
export const adminUpdateTip = (id, status) => adminClient.patch(`/admin/tips/${id}`, { status }).then((r) => r.data);
export const adminDeleteTip = (id) => adminClient.delete(`/admin/tips/${id}`).then((r) => r.data);

export const adminSubscribers = () => adminClient.get("/admin/subscribers").then((r) => r.data);
export const adminMemberships = () => adminClient.get("/admin/memberships").then((r) => r.data);

export const adminListComments = (status) =>
  adminClient.get("/admin/comments", { params: status ? { status } : {} }).then((r) => r.data);
export const adminUpdateComment = (id, status) => adminClient.patch(`/admin/comments/${id}`, { status }).then((r) => r.data);
export const adminDeleteComment = (id) => adminClient.delete(`/admin/comments/${id}`).then((r) => r.data);

export const adminGetHomepage = () => adminClient.get("/admin/homepage").then((r) => r.data);
export const adminSaveHomepage = (cfg) => adminClient.put("/admin/homepage", cfg).then((r) => r.data);

// ── AI Writing Assistant ──────────────────────────────────────────────────────
export const adminAiDraftFromHeadline = (title, category) =>
  adminClient.post("/admin/ai/draft-from-headline", { title, category }).then((r) => r.data);

export const adminAiGenerateDek = (title, body) =>
  adminClient.post("/admin/ai/generate-dek", { title, body }).then((r) => r.data);

export const adminAiSuggestTags = (body) =>
  adminClient.post("/admin/ai/suggest-tags", { body }).then((r) => r.data);

export const adminAiImproveParagraph = (text) =>
  adminClient.post("/admin/ai/improve-paragraph", { text }).then((r) => r.data);

// ── News Scraper ──────────────────────────────────────────────────────────────
export const adminRunScraper = () =>
  adminClient.post("/admin/scraper/run").then((r) => r.data);

export const adminScraperStatus = () =>
  adminClient.get("/admin/scraper/status").then((r) => r.data);

