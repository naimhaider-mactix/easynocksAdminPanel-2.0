import axios from "axios";

const dashboardAxios = axios.create({
  baseURL: import.meta.env.VITE_USER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor
dashboardAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // ensure headers object exists
    config.headers = config.headers || {};

    // attach token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // required location headers
    config.headers["X-Latitude"] = "22.5726";
    config.headers["X-Longitude"] = "88.3639";

    return config;
  },
  (error) => Promise.reject(error)
);

export default dashboardAxios;