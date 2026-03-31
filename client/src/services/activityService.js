import api from "./api";

export const getActivityLogs = async () => {
  const { data } = await api.get("/activity");
  return data;
};
