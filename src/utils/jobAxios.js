import axios from "axios";
import { getLocation } from "./locationStore";

const jobAxios = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_URL,
  headers: { "Content-Type": "application/json" },
});

jobAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const { lat, lng } = getLocation();
    config.headers["X-Latitude"] = lat;
    config.headers["X-Longitude"] = lng;

    return config;
  },
  (error) => Promise.reject(error),
);

export default jobAxios;
