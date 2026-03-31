import api from "./api";

export const sendManagerRequest = async (toUserId) => {
  const { data } = await api.post("/manager-requests", { to: toUserId });
  return data;
};

export const getIncomingRequests = async () => {
  const { data } = await api.get("/manager-requests/incoming");
  return data;
};

export const getOutgoingRequests = async () => {
  const { data } = await api.get("/manager-requests/outgoing");
  return data;
};

export const acceptRequest = async (requestId) => {
  const { data } = await api.put(`/manager-requests/${requestId}/accept`);
  return data;
};

export const declineRequest = async (requestId) => {
  const { data } = await api.put(`/manager-requests/${requestId}/decline`);
  return data;
};
