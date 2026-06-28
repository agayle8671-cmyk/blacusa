import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getCounters = async () => {
  const { data } = await axios.get(`${API}/counters`);
  return data;
};
