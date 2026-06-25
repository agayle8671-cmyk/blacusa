import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.response.use((response) => {
  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("text/html") || (typeof response.data === "string" && response.data.trim().startsWith("<!DOCTYPE"))) {
    throw new Error("Expected JSON, but received HTML. Verify REACT_APP_BACKEND_URL environment variable.");
  }
  return response;
});

export const getArticles = (params = {}) =>
  client.get("/articles", { params }).then((r) => r.data);

export const getArticle = (slug) =>
  client.get(`/articles/${slug}`).then((r) => r.data);

export const getCategories = () =>
  client.get("/categories").then((r) => r.data);

export const getColdCases = (params = {}) =>
  client.get("/cold-cases", { params }).then((r) => r.data);

export const getColdCaseStats = () =>
  client.get("/cold-cases/stats").then((r) => r.data);

export const getColdCase = (caseNumber) =>
  client.get(`/cold-cases/${caseNumber}`).then((r) => r.data);

export const submitTip = (payload) =>
  client.post("/tips", payload).then((r) => r.data);

export const getMembershipTiers = () =>
  client.get("/membership/tiers").then((r) => r.data);

export const joinMembership = (payload) =>
  client.post("/membership", payload).then((r) => r.data);

export const subscribe = (payload) =>
  client.post("/subscribe", payload).then((r) => r.data);
