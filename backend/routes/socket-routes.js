import {
    handleSocketDisconnect,
    handleJoinRoom,
    handleLeaveRoom,
    handleSendMessage,
    handleDeleteMessage,
    handleAddReaction,
    handleRemoveReaction,
    handleTyping,
    handleUpdateStatus,
    handleMarkRead
} from "../handlers/socket-handler.js";
import { auth } from "../auth.js";
import { prisma } from "../utils/prisma.js";

export const registerSocketRoutes = (io) => {
    // Middleware for Socket Auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            let session = null;

            if (token) {
                session = await auth.api.getSession({
                    headers: new Headers({ authorization: `Bearer ${token}` })
                });
            } else if (socket.handshake.headers.cookie) {
                session = await auth.api.getSession({
                    headers: new Headers({ cookie: socket.handshake.headers.cookie })
                });
            }

            if (!session || !session.user) {
                return next(new Error("Unauthorized"));
            }

            socket.user = session.user;
            
            // Mark user as online upon connection
            await prisma.user.update({
                where: { id: socket.user.id },
                data: { status: "ONLINE", lastSeen: new Date() }
            });
            io.emit("user_status_changed", { userId: socket.user.id, status: "ONLINE" });

            next();
        } catch (error) {
            console.error("Socket authentication error:", error);
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id, "User ID:", socket.user.id);

        socket.on("join_room", handleJoinRoom(socket));
        socket.on("leave_room", handleLeaveRoom(socket));
        
        socket.on("send_message", handleSendMessage(socket, io));
        socket.on("delete_message", handleDeleteMessage(socket, io));
        socket.on("add_reaction", handleAddReaction(socket, io));
        socket.on("remove_reaction", handleRemoveReaction(socket, io));
        
        socket.on("typing", handleTyping(socket, io));
        socket.on("update_status", handleUpdateStatus(socket, io));
        socket.on("mark_read", handleMarkRead(socket, io));

        socket.on("disconnect", handleSocketDisconnect(socket, io));
    });
};
