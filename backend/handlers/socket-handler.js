import { prisma } from "../utils/prisma.js";

export const handleSocketDisconnect = (socket) => {
    return () => {
        console.log("User disconnected:", socket.id);
        // Possible: update presence status here in Redis
    };
};

export const handleJoinRoom = (socket) => {
    return async ({ roomId }) => {
        // roomId could be channelId or threadId
        socket.join(roomId);
        console.log(`User ${socket.user.id} joined room ${roomId}`);
    };
};

export const handleLeaveRoom = (socket) => {
    return async ({ roomId }) => {
        socket.leave(roomId);
        console.log(`User ${socket.user.id} left room ${roomId}`);
    };
};

export const handleSendMessage = (socket, io) => {
    return async (data) => {
        try {
            const { content, channelId, threadId, organizationId } = data;

            // 1. Verify user is a member of the organization
            const member = await prisma.member.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: socket.user.id
                    }
                }
            });

            if (!member || member.isBanned) return;

            // 1.5 Verify RBAC (Can Write)
            if (channelId) {
                 const channel = await prisma.channel.findUnique({ where: { id: channelId } });
                 if (!channel) return;
                 const isSuperUser = member.role === "admin" || member.role === "owner";
                 
                 if (!isSuperUser) {
                    // Check if role is strictly read-only
                    if (channel.readOnlyRoles.includes(member.role)) {
                        return socket.emit("error", { message: "You only have read access to this channel" });
                    }
                    
                    // Check if role is allowed to write in private channel
                    if (channel.isPrivate && !channel.allowedRoles.includes(member.role)) {
                        return socket.emit("error", { message: "You do not have write access to this channel" });
                    }
                 }
            }

            // 2. Save the message to DB
            const newMessage = await prisma.message.create({
                data: {
                    content,
                    authorId: member.id,
                    channelId: channelId || null,
                    threadId: threadId || null
                },
                include: {
                    author: {
                        include: {
                            user: {
                                select: { name: true, image: true }
                            }
                        }
                    },
                    attachments: true,
                    reactions: true
                }
            });

            // 3. Broadcast to the relevant room
            const roomId = threadId || channelId;
            io.to(roomId).emit("new_message", newMessage);
            
        } catch (error) {
            console.error("Socket send_message error:", error);
            socket.emit("error", { message: "Failed to send message" });
        }
    };
};

export const handleDeleteMessage = (socket, io) => {
    return async (data) => {
        try {
            const { messageId, organizationId } = data;

            const member = await prisma.member.findUnique({
                where: {
                    organizationId_userId: { organizationId, userId: socket.user.id }
                }
            });
            if (!member) return;

            const message = await prisma.message.findUnique({ where: { id: messageId } });
            if (!message) return;

            // Make sure the user is the author (or an admin/mod later on using permissions)
            if (message.authorId !== member.id) {
               return socket.emit("error", { message: "Unauthorized to delete this message" });
            }

            await prisma.message.update({
                where: { id: messageId },
                data: { content: "This message was deleted.", isDeleted: true }
            });

            const roomId = message.threadId || message.channelId;
            io.to(roomId).emit("message_deleted", { messageId, roomId });
        } catch (error) {
            console.error("Socket delete_message error:", error);
        }
    };
};

export const handleAddReaction = (socket, io) => {
    return async (data) => {
        try {
            const { messageId, emoji, organizationId } = data;

            const member = await prisma.member.findUnique({
                where: {
                    organizationId_userId: { organizationId, userId: socket.user.id }
                }
            });
            if (!member) return;

            const reaction = await prisma.reaction.create({
                data: {
                    emoji,
                    messageId,
                    memberId: member.id
                }
            });

            const message = await prisma.message.findUnique({ where: { id: messageId } });
            const roomId = message.threadId || message.channelId;

            io.to(roomId).emit("reaction_added", { reaction, messageId });
        } catch (error) {
            console.error("Socket add_reaction error:", error);
        }
    };
};
