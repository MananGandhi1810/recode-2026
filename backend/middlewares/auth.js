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

        req.member = member;
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

export const requireOrgAdmin = (req, res, next) => {
    if (!req.member) {
        return res.status(401).json({ success: false, message: "Member context missing" });
    }

    if (req.member.role !== "admin" && req.member.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Requires Admin or Owner role",
            data: null
        });
    }

    next();
};
