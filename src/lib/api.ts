import axios from "axios";
import { io } from "socket.io-client";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

export const socket = io(window.location.origin, {
  withCredentials: true,
  autoConnect: false,
});

export default api;
