import api from "../api/axios";

export const getTimeline = async (interval) => {
  const res = await api.get("/snapshot/timeline", {
    params: { interval, limit: 10 },
  });

  return res.data;
};