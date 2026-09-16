import axios from "axios";

export const authAPI = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API,
});

export const patientAPI = axios.create({
  baseURL: import.meta.env.VITE_PATIENT_API,
});

export const doctorAPI = axios.create({
  baseURL: import.meta.env.VITE_DOCTOR_API,
});

export const appointmentAPI = axios.create({
  baseURL: import.meta.env.VITE_APPOINTMENT_API,
});

export const telemedicineAPI = axios.create({
  baseURL: import.meta.env.VITE_TELEMEDICINE_API || "http://localhost:5004/api",
});

export const paymentAPI = axios.create({
  baseURL: import.meta.env.VITE_PAYMENT_API,
});

export const prescriptionAPI = axios.create({
  baseURL: import.meta.env.VITE_PRESCRIPTION_API,
});

export const setAuthToken = (token) => {
  const apis = [
    authAPI,
    patientAPI,
    doctorAPI,
    appointmentAPI,
    telemedicineAPI,
    paymentAPI,
    prescriptionAPI,
  ];

  if (token) {
    apis.forEach((api) => {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    });
    localStorage.setItem("token", token);
  } else {
    apis.forEach((api) => {
      delete api.defaults.headers.common.Authorization;
    });
    localStorage.removeItem("token");
  }
};

const applyStoredToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }
};

applyStoredToken();