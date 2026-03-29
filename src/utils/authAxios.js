import axios from "axios";

const authAxios = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Latitude": "22.5726",
    "X-Longitude": "88.3639"
}
});

export default authAxios;