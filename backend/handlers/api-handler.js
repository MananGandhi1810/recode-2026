import { prisma } from "../utils/prisma.js";

export const getHome = (req, res) => {
    return res.status(200).json({ success: true, message: "Nexus Core Operational" });
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, image, jobTitle } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, image, jobTitle }
        });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getChannels = async (req, res) => {
    try {
        const channels = await prisma.channel.findMany({
            where: { organizationId: req.params.orgId },
            include: { category: true },
            orderBy: { createdAt: 'asc' }
        });
        return res.status(200).json({ success: true, data: channels });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getOrgMembers = async (req, res) => {
    try {
        const members = await prisma.member.findMany({
            where: { organizationId: req.params.orgId },
            include: {
                user: { select: { id: true, name: true, image: true, email: true, status: true, jobTitle: true } },
                memberRoles: { include: { role: true } }
            }
        });
        const withPerms = members.map(m => {
            const perms = new Set();
            if (m.role === "owner" || m.role === "admin") {
                ["VIEW_CHANNELS", "SEND_MESSAGES", "CREATE_CHANNELS", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "MANAGE_ROLES", "BAN_MEMBERS", "ADD_REACTIONS", "MANAGE_SERVER"].forEach(p => perms.add(p));
            }
            m.memberRoles.forEach(mr => mr.role.permissions.forEach(p => perms.add(p)));
            return { ...m, permissions: Array.from(perms) };
        });
        return res.status(200).json({ success: true, data: withPerms });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getDMs = async (req, res) => {
    try {
        const dms = await prisma.channel.findMany({
            where: { organizationId: req.params.orgId, channelMembers: { some: { memberId: req.member.id } } },
            include: { channelMembers: { include: { member: { include: { user: { select: { id: true, name: true, image: true, status: true } } } } } } }
        });
        // Filtering actually redundant if schema followed correctly for DMs
        return res.status(200).json({ success: true, data: dms });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createDM = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const targetMember = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: req.params.orgId, userId: targetUserId } }
        });
        if (!targetMember) return res.status(404).json({ success: false, message: "User not found in org" });

        const channel = await prisma.channel.create({
            data: {
                name: `dm-${[req.member.id, targetMember.id].sort().join('-')}`,
                organizationId: req.params.orgId,
                channelMembers: { create: [{ memberId: req.member.id }, { memberId: targetMember.id }] }
            }
        });
        return res.status(201).json({ success: true, data: channel });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const initializeOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const roleCount = await prisma.organizationRole.count({ where: { organizationId: orgId } });
        if (roleCount > 0) return res.status(200).json({ success: true, message: "Already initialized" });

        const adminRole = await prisma.organizationRole.create({
            data: {
                name: "Administrator",
                permissions: ["VIEW_CHANNELS", "SEND_MESSAGES", "CREATE_CHANNELS", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "MANAGE_ROLES", "BAN_MEMBERS", "ADD_REACTIONS", "MANAGE_SERVER"],
                color: "#f43f5e",
                position: 100,
                organizationId: orgId
            }
        });

        await prisma.organizationRole.create({
            data: {
                name: "Member",
                permissions: ["VIEW_CHANNELS", "SEND_MESSAGES", "ADD_REACTIONS"],
                color: "#10b981",
                position: 1,
                organizationId: orgId,
                isBaseRole: true
            }
        });

        const currentMember = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: orgId, userId: req.user.id } }
        });

        if (currentMember) {
            await prisma.memberRole.create({
                data: { memberId: currentMember.id, roleId: adminRole.id }
            });
        }

        const textCat = await prisma.category.create({ data: { name: "TEXT CHANNELS", organizationId: orgId } });
        await prisma.channel.create({
            data: {
                name: "general",
                description: "Main workspace hub",
                type: "TEXT",
                organizationId: orgId,
                categoryId: textCat.id
            }
        });

        return res.status(200).json({ success: true, message: "Nexus Workspace Initialized" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getRoles = async (req, res) => {
    try {
        const roles = await prisma.organizationRole.findMany({
            where: { organizationId: req.params.orgId },
            orderBy: { position: 'desc' }
        });
        return res.status(200).json({ success: true, data: roles });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createRole = async (req, res) => {
    try {
        const { name, permissions, color, position } = req.body;
        const role = await prisma.organizationRole.create({
            data: { name, permissions, color, position, organizationId: req.params.orgId }
        });
        return res.status(201).json({ success: true, data: role });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateMemberRoles = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { roleIds } = req.body;
        await prisma.memberRole.deleteMany({ where: { memberId } });
        await prisma.memberRole.createMany({ data: roleIds.map(rid => ({ memberId, roleId: rid })) });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { name, description, type, categoryId } = req.body;
        const channel = await prisma.channel.create({
            data: {
                name: name.toLowerCase().replace(/\s+/g, '-'),
                description,
                type: type || "TEXT",
                organizationId: req.params.orgId,
                categoryId
            }
        });
        return res.status(201).json({ success: true, data: channel });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { channelId: req.params.channelId },
            include: {
                author: { include: { user: { select: { id: true, name: true, image: true, status: true, jobTitle: true } } } },
                attachments: true,
                reactions: { include: { member: { include: { user: { select: { id: true, name: true } } } } } },
                parentMessage: { include: { author: { include: { user: { select: { name: true } } } } } }
            },
            orderBy: { createdAt: 'asc' }
        });
        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const banMember = async (req, res) => {
    try {
        await prisma.member.update({
            where: { id: req.params.memberId },
            data: { isBanned: true }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const unbanMember = async (req, res) => {
    try {
        await prisma.member.update({
            where: { id: req.params.memberId },
            data: { isBanned: false }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
