import { prisma } from "../utils/prisma.js";

export const handleSocketDisconnect = (socket, io) => {
    return async () => {
        if (socket.user) {
            try {
                await prisma.user.update({
                    where: { id: socket.user.id },
                    data: { status: "OFFLINE", lastSeen: new Date() }
                });
                io.emit("user_status_changed", { userId: socket.user.id, status: "OFFLINE" });
            } catch (error) {
                console.error("Disconnect error", error);
            }
        }
    };
};

export const handleJoinRoom = (socket) => {
    return async ({ roomId }) => {
        console.log(`User ${socket.user?.id} joining room ${roomId}`);
        socket.join(roomId);
    };
};

export const handleLeaveRoom = (socket) => {
    return async ({ roomId }) => {
        console.log(`User ${socket.user?.id} leaving room ${roomId}`);
        socket.leave(roomId);
    };
};

export const handleTyping = (socket, io) => {
    return async ({ roomId, isTyping }) => {
        socket.to(roomId).emit("user_typing", { 
            userId: socket.user.id, 
            isTyping,
            roomId 
        });
    };
};

export const handleSendMessage = (socket, io) => {
    return async (data) => {
        try {
            const { content, channelId, organizationId, attachmentUrl, attachmentType, attachmentName, attachmentSize, parentMessageId } = data;
            
            console.log("Processing message for channel:", channelId, "from user:", socket.user.id);

            const member = await prisma.member.findUnique({
                where: { organizationId_userId: { organizationId, userId: socket.user.id } }
            });

            if (!member || member.isBanned) return;

            const newMessage = await prisma.message.create({
                data: {
                    content: content || "",
                    authorId: member.id,
                    channelId,
                    parentMessageId: parentMessageId || null,
                    attachments: attachmentUrl ? {
                        create: {
                            url: attachmentUrl,
                            fileType: attachmentType || "unknown",
                            fileName: attachmentName || "file",
                            fileSize: attachmentSize || 0
                        }
                    } : undefined
                },
                include: {
                    author: {
                        include: { user: { select: { id: true, name: true, image: true, email: true, jobTitle: true, status: true } } }
                    },
                    attachments: true,
                    reactions: {
                        include: { member: { include: { user: { select: { id: true, name: true } } } } }
                    },
                    parentMessage: {
                        include: { author: { include: { user: { select: { name: true } } } } }
                    }
                }
            });

            io.to(channelId).emit("new_message", newMessage);
            
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
                where: { organizationId_userId: { organizationId, userId: socket.user.id } }
            });
            if (!member) return;

            const message = await prisma.message.findUnique({ where: { id: messageId } });
            if (!message) return;

            // Simplified: only author or admins can delete
            if (message.authorId !== member.id && member.role !== 'owner' && member.role !== 'admin') {
               return socket.emit("error", { message: "Unauthorized" });
            }

            await prisma.message.update({
                where: { id: messageId },
                data: { content: "This message was deleted.", isDeleted: true }
            });

            io.to(message.channelId).emit("message_deleted", { messageId, channelId: message.channelId });
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
                where: { organizationId_userId: { organizationId, userId: socket.user.id } }
            });
            if (!member) return;

            const reaction = await prisma.reaction.upsert({
                where: { messageId_memberId_emoji: { messageId, memberId: member.id, emoji } },
                update: {},
                create: { emoji, messageId, memberId: member.id },
                include: { member: { include: { user: { select: { id: true, name: true } } } } }
            });

            const message = await prisma.message.findUnique({ where: { id: messageId } });
            io.to(message.channelId).emit("reaction_added", { reaction, messageId });
        } catch (error) {
            console.error("Socket add_reaction error:", error);
        }
    };
};

export const handleRemoveReaction = (socket, io) => {
    return async (data) => {
        try {
            const { messageId, emoji, organizationId } = data;
            const member = await prisma.member.findUnique({
                where: { organizationId_userId: { organizationId, userId: socket.user.id } }
            });
            if (!member) return;

            const reaction = await prisma.reaction.findUnique({
                where: { messageId_memberId_emoji: { messageId, memberId: member.id, emoji } }
            });

            if (reaction) {
                await prisma.reaction.delete({ where: { id: reaction.id } });
                const message = await prisma.message.findUnique({ where: { id: messageId } });
                io.to(message.channelId).emit("reaction_removed", { reactionId: reaction.id, messageId, emoji, memberId: member.id });
            }
        } catch (error) {
            console.error("Socket remove_reaction error:", error);
        }
    };
};

// Placeholder handlers to avoid errors
export const handleUpdateStatus = () => async () => {};
export const handleMarkRead = () => async () => {};
