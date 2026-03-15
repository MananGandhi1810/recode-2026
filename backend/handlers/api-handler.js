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
        const orgId = req.params.orgId;
        const member = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: orgId, userId: req.user.id } }
        });

        if (!member) return res.status(403).json({ success: false });

        const isAdmin = member.role === "owner" || member.role === "admin";

        const channels = await prisma.channel.findMany({
            where: { 
                organizationId: orgId,
                OR: [
                    { isPrivate: false },
                    { channelMembers: { some: { memberId: member.id } } }
                ]
            },
            include: { category: true },
            orderBy: { createdAt: 'asc' }
        });

        // Filter for admins if they aren't explicitly in channelMembers but need to see private channels
        let finalChannels = channels;
        if (isAdmin) {
            finalChannels = await prisma.channel.findMany({
                where: { organizationId: orgId },
                include: { category: true },
                orderBy: { createdAt: 'asc' }
            });
        }

        return res.status(200).json({ success: true, data: finalChannels });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getOrgDetails = async (req, res) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.params.orgId }
        });
        if (!org) return res.status(404).json({ success: false });
        return res.status(200).json({ success: true, data: org });
    } catch (error) {
        return res.status(500).json({ success: false });
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
        return res.status(200).json({ success: true, data: dms });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getGlobalDMs = async (req, res) => {
    try {
        const dms = await prisma.channel.findMany({
            where: { 
                channelMembers: { some: { member: { userId: req.user.id } } },
                organizationId: { not: "" } // DMs still linked to orgs but we fetch all
            },
            include: { 
                organization: { select: { name: true, id: true } },
                channelMembers: { 
                    include: { 
                        member: { 
                            include: { 
                                user: { select: { id: true, name: true, image: true, status: true } } 
                            } 
                        } 
                    } 
                } 
            }
        });
        return res.status(200).json({ success: true, data: dms });
    } catch (error) {
        return res.status(500).json({ success: false });
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
                color: "#ff79c6",
                organizationId: orgId,
                isBaseRole: true
            }
        });

        const memberRole = await prisma.organizationRole.create({
            data: {
                name: "Member",
                permissions: ["VIEW_CHANNELS", "SEND_MESSAGES", "ADD_REACTIONS"],
                color: "#8be9fd",
                organizationId: orgId,
                isBaseRole: true
            }
        });

        // Generate initial join code if missing
        await prisma.organization.update({
            where: { id: orgId },
            data: { joinCode: `NX-${Math.random().toString(36).substring(2, 8).toUpperCase()}` }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false });
    }
};

export const updateOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { name, logo, isPublic } = req.body;
        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: { name, logo, isPublic }
        });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false });
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
        return res.status(500).json({ success: false });
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

export const updateRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { name, permissions, color, position } = req.body;
        const role = await prisma.organizationRole.update({
            where: { id: roleId },
            data: { name, permissions, color, position }
        });
        return res.status(200).json({ success: true, data: role });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const role = await prisma.organizationRole.findUnique({ where: { id: roleId } });
        if (!role) return res.status(404).json({ success: false });
        if (role.isBaseRole) return res.status(400).json({ success: false, message: "Cannot delete base roles" });

        await prisma.organizationRole.delete({ where: { id: roleId } });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const updateMemberRoles = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { roleIds } = req.body;
        const orgId = req.params.orgId;

        const requester = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: orgId, userId: req.user.id } }
        });

        if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const targetMember = await prisma.member.findUnique({ where: { id: memberId } });
        if (!targetMember) return res.status(404).json({ success: false });

        if (targetMember.role === 'owner' && requester.role !== 'owner') {
            return res.status(403).json({ success: false, message: "Cannot manage owner roles" });
        }

        if (targetMember.userId === req.user.id && requester.role !== 'owner') {
            return res.status(403).json({ success: false, message: "Cannot manage your own admin status" });
        }

        await prisma.memberRole.deleteMany({ where: { memberId } });
        await prisma.memberRole.createMany({
            data: roleIds.map(roleId => ({ memberId, roleId }))
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { name, description, type, categoryId, isPrivate } = req.body;
        const orgId = req.params.orgId;

        const creatorMember = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: orgId, userId: req.user.id } }
        });

        if (!creatorMember) return res.status(403).json({ success: false });

        const channel = await prisma.channel.create({
            data: {
                name: name.toLowerCase().replace(/\s+/g, '-'),
                description,
                type: type || "TEXT",
                organizationId: orgId,
                categoryId: categoryId || null,
                isPrivate: !!isPrivate,
                channelMembers: { create: { memberId: creatorMember.id } }
            }
        });
        return res.status(201).json({ success: true, data: channel });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { name, description, isPrivate } = req.body;
        
        const channel = await prisma.channel.update({
            where: { id: channelId },
            data: {
                name: name ? name.toLowerCase().replace(/\s+/g, '-') : undefined,
                description,
                isPrivate
            }
        });
        return res.status(200).json({ success: true, data: channel });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { channelMembers: true }
        });

        if (!channel) return res.status(404).json({ success: false });

        const orgId = channel.organizationId;
        const member = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: orgId, userId: req.user.id } }
        });

        if (!member) return res.status(403).json({ success: false });

        if (channel.isPrivate) {
            const isMember = channel.channelMembers.some(cm => cm.memberId === member.id);
            const isAdmin = member.role === "owner" || member.role === "admin";
            if (!isMember && !isAdmin) return res.status(403).json({ success: false });
        }

        const messages = await prisma.message.findMany({
            where: { channelId },
            include: {
                author: { include: { user: { select: { id: true, name: true, image: true, email: true, status: true, jobTitle: true } } } },
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

export const getPublicOrgs = async (req, res) => {
    try {
        const orgs = await prisma.organization.findMany({
            where: { isPublic: true },
            select: { id: true, name: true, slug: true, logo: true, joinCode: true, _count: { select: { members: true } } }
        });
        return res.status(200).json({ success: true, data: orgs });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const joinByCode = async (req, res) => {
    try {
        const { joinCode } = req.body;
        const org = await prisma.organization.findUnique({
            where: { joinCode }
        });

        if (!org) return res.status(404).json({ success: false, message: "Invalid join code" });

        const existing = await prisma.member.findUnique({
            where: { organizationId_userId: { organizationId: org.id, userId: req.user.id } }
        });

        if (existing) return res.status(400).json({ success: false, message: "Already a member" });

        const newMember = await prisma.member.create({
            data: {
                organizationId: org.id,
                userId: req.user.id,
                role: "member"
            },
            include: { user: true }
        });

        // Send system message to first channel
        const firstChannel = await prisma.channel.findFirst({
            where: { organizationId: org.id },
            orderBy: { createdAt: 'asc' }
        });

        if (firstChannel) {
            await prisma.message.create({
                data: {
                    content: `***${newMember.user.name} has entered the node.***`,
                    authorId: newMember.id,
                    channelId: firstChannel.id
                }
            });
        }

        return res.status(200).json({ success: true, data: org });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const regenerateJoinCode = async (req, res) => {
    try {
        const { orgId } = req.params;
        const newCode = `NX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const org = await prisma.organization.update({
            where: { id: orgId },
            data: { joinCode: newCode }
        });
        return res.status(200).json({ success: true, data: org.joinCode });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const getWorkspaceEmojis = async (req, res) => {
    try {
        const emojis = await prisma.workspaceEmoji.findMany({
            where: { organizationId: req.params.orgId }
        });
        return res.status(200).json({ success: true, data: emojis });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const createWorkspaceEmoji = async (req, res) => {
    try {
        const { name, url } = req.body;
        const emoji = await prisma.workspaceEmoji.create({
            data: { name, url, organizationId: req.params.orgId }
        });
        return res.status(201).json({ success: true, data: emoji });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const deleteWorkspaceEmoji = async (req, res) => {
    try {
        await prisma.workspaceEmoji.delete({
            where: { id: req.params.emojiId }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};
