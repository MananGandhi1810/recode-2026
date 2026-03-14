import {
    handleSocketDisconnect,
    handleJoinRoom,
    handleLeaveRoom,
    handleSendMessage,
    handleDeleteMessage,
    handleAddReaction
} from "../handlers/socket-handler.js";
import { auth } from "../auth.js";
import { parse } from "cookie"; // You might need to install 'cookie' parser or use raw headers. Better Auth sends session in cookies usually

export const registerSocketRoutes = (io) => {
    // Middleware for Socket Auth
    io.use(async (socket, next) => {
        try {
            // First check for session token in auth payload (if frontend passes it)
            const token = socket.handshake.auth?.token;
            let session = null;

            if (token) {
                // If using Bearer token
                session = await auth.api.getSession({
                    headers: new Headers({
                        authorization: `Bearer ${token}`
                    })
                });
            } else if (socket.handshake.headers.cookie) {
                // Fallback to cookie
                session = await auth.api.getSession({
                    headers: new Headers({
                        cookie: socket.handshake.headers.cookie
                    })
                });
            }

            if (!session || !session.user) {
                return next(new Error("Unauthorized"));
            }

            // Attach user to socket
            socket.user = session.user;
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

        socket.on("disconnect", handleSocketDisconnect(socket));
    });
};
