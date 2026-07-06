
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server", socket.id);
});
