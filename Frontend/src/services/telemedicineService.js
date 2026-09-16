import { telemedicineAPI } from "../api/axios";

export const getSessionByAppointment = async (appointmentId) => {
  const { data } = await telemedicineAPI.get(`/sessions/appointment/${appointmentId}`);
  return data;
};

export const joinSession = async (sessionId) => {
  const { data } = await telemedicineAPI.put(`/sessions/${sessionId}/join`);
  return data;
};

export const endSession = async (sessionId) => {
  const { data } = await telemedicineAPI.put(`/sessions/${sessionId}/end`);
  return data;
};

export const createSession = async (payload) => {
  const { data } = await telemedicineAPI.post("/sessions", payload);
  return data;
};