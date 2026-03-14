import { prisma } from "../utils/prisma.js";

export const getHome = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to the API",
        data: null
    });
};

export const getChannels = async (req, res) => {
    try {
        const { orgId } = req.params;
        const member = req.member;

        const channels = await prisma.channel.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'asc' }
        });
        
        // Filter channels based on RBAC
        const isSuperUser = member.role === "admin" || member.role === "owner";
        
        const visibleChannels = channels.filter(channel => {
            if (isSuperUser) return true;
            if (!channel.isPrivate) return true;
            
            return channel.allowedRoles.includes(member.role) || channel.readOnlyRoles.includes(member.role);
        });

        return res.status(200).json({ success: true, data: visibleChannels });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { name, description, type, isPrivate, allowedRoles, readOnlyRoles } = req.body;
        
        // Ensure only admins/owners can create a channel (or via strict better-auth roles)
        if (req.member.role !== "admin" && req.member.role !== "owner") {
             // For a broader system you could check dynamic permissions here
             return res.status(403).json({ success: false, message: "Unauthorized to create channels" });
        }
        
        const channel = await prisma.channel.create({
            data: {
                name,
                description,
                type: type || "TEXT",
                isPrivate: isPrivate || false,
                allowedRoles: allowedRoles || [],
                readOnlyRoles: readOnlyRoles || [],
                organizationId: orgId
            }
        });
        
        return res.status(201).json({ success: true, data: channel });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateChannelAccess = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { allowedRoles, readOnlyRoles, isPrivate } = req.body;

        const channel = await prisma.channel.update({
            where: { id: channelId },
            data: {
                ...(isPrivate !== undefined && { isPrivate }),
                ...(allowedRoles && { allowedRoles }),
                ...(readOnlyRoles && { readOnlyRoles })
            }
        });

        return res.status(200).json({ success: true, data: channel });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const member = req.member;
        const cursor = req.query.cursor;
        const limit = parseInt(req.query.limit) || 50;

        // Validation - verify read access
        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ success: false, message: "Channel not found" });

        const isSuperUser = member.role === "admin" || member.role === "owner";
        if (!isSuperUser && channel.isPrivate) {
            const canRead = channel.allowedRoles.includes(member.role) || channel.readOnlyRoles.includes(member.role);
            if (!canRead) return res.status(403).json({ success: false, message: "Forbidden channel" });
        }

        const messages = await prisma.message.findMany({
            where: { channelId, isDeleted: false },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
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

        return res.status(200).json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const banMember = async (req, res) => {
    try {
        const { orgId, memberId } = req.params;
        
        await prisma.member.update({
            where: { id: memberId, organizationId: orgId },
            data: { isBanned: true }
        });

        return res.status(200).json({ success: true, message: "Member banned successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const unbanMember = async (req, res) => {
    try {
        const { orgId, memberId } = req.params;
        
        await prisma.member.update({
            where: { id: memberId, organizationId: orgId },
            data: { isBanned: false }
        });

        return res.status(200).json({ success: true, message: "Member unbanned successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
