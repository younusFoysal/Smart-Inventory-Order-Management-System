import api from "./api";

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const updateUserRole = async (userId, role) => {
  const { data } = await api.put(`/users/${userId}/role`, { role });
  return data;
};
