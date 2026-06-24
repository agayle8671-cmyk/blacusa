import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

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
