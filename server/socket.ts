import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined room`);
    });

    socket.on("join-admin", () => {
      socket.join("admin-projects");
      console.log("Admin joined admin-projects room");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
