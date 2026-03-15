import { auth } from "../auth.js";
import { prisma } from "../utils/prisma.js";

export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session || !session.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null
            });
        }

        req.user = session.user;
        req.session = session.session;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
            data: null
        });
    }
};

export const requireOrgMember = async (req, res, next) => {
    try {
        const orgId = req.params.orgId || req.body.organizationId || req.query.organizationId;
        
        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID is required" });
        }

        const member = await prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId: req.user.id
                }
            },
            include: {
                memberRoles: {
                    include: { role: true }
                }
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Not a member of this organization",
                data: null
            });
        }

        if (member.isBanned) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are banned from this organization",
                data: null
            });
        }

        // Aggregate permissions
        const permissions = new Set();
        if (member.role === "owner" || member.role === "admin") {
            // Give all permissions for legacy roles
            ["VIEW_CHANNELS", "SEND_MESSAGES", "CREATE_CHANNELS", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "MANAGE_ROLES", "BAN_MEMBERS"].forEach(p => permissions.add(p));
        }
        
        member.memberRoles.forEach(mr => {
            mr.role.permissions.forEach(p => permissions.add(p));
        });

        // Add base permissions if not present
        if (permissions.size === 0) {
            ["VIEW_CHANNELS", "SEND_MESSAGES", "ADD_REACTIONS"].forEach(p => permissions.add(p));
        }

        req.member = member;
        req.permissions = Array.from(permissions);
        next();
    } catch (error) {
        console.error("Org auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during organization authorization",
            data: null
        });
    }
};

export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.permissions || !req.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Missing permission ${permission}`,
                data: null
            });
        }
        next();
    };
};

// Compatibility wrapper
export const requireOrgAdmin = (req, res, next) => {
    if (req.permissions.includes("MANAGE_CHANNELS") || req.permissions.includes("MANAGE_ROLES")) {
        return next();
    }
    return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
};
