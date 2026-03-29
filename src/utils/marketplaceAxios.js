// import axios from "axios";

// const marketAxios = axios.create({
//   baseURL: import.meta.env.VITE_MARKET_PLACE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default marketAxios;


import axios from "axios";

const marketplaceAxios = axios.create({
  baseURL: import.meta.env.VITE_MARKET_PLACE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 Add interceptor
marketplaceAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If your backend requires location headers
    config.headers["X-Latitude"] = "22.5726";
    config.headers["X-Longitude"] = "88.3639";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default marketplaceAxios;