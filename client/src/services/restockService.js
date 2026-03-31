import api from "./api";

export const getRestockQueue = async () => {
  const { data } = await api.get("/restock");
  return data;
};

export const restockProduct = async (id, quantity) => {
  const { data } = await api.put(`/restock/${id}`, { quantity });
  return data;
};
