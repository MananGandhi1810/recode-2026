import { Router } from "express";
import { getHome, getChannels, createChannel, getMessages, banMember, unbanMember, updateUserProfile, getOrgMembers, getDMs, createDM, getRoles, createRole, updateMemberRoles, initializeOrg } from "../handlers/api-handler.js";
import { requireAuth, requireOrgMember, requireOrgAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", getHome);

router.post("/user/profile", requireAuth, updateUserProfile);

// Organization Rooms & Channels
router.post("/orgs/:orgId/init", requireAuth, requireOrgMember, initializeOrg);
router.get("/orgs/:orgId/channels", requireAuth, requireOrgMember, getChannels);
router.get("/orgs/:orgId/members", requireAuth, requireOrgMember, getOrgMembers);
router.get("/orgs/:orgId/dms", requireAuth, requireOrgMember, getDMs);
router.post("/orgs/:orgId/dms", requireAuth, requireOrgMember, createDM);
router.post("/orgs/:orgId/channels", requireAuth, requireOrgMember, createChannel);

// Role Management
router.get("/orgs/:orgId/roles", requireAuth, requireOrgMember, getRoles);
router.post("/orgs/:orgId/roles", requireAuth, requireOrgMember, requireOrgAdmin, createRole);
router.put("/orgs/:orgId/members/:memberId/roles", requireAuth, requireOrgMember, requireOrgAdmin, updateMemberRoles);

router.get("/orgs/:orgId/channels/:channelId/messages", requireAuth, requireOrgMember, getMessages);

// Moderation 
router.put("/orgs/:orgId/members/:memberId/ban", requireAuth, requireOrgMember, requireOrgAdmin, banMember);
router.put("/orgs/:orgId/members/:memberId/unban", requireAuth, requireOrgMember, requireOrgAdmin, unbanMember);

export default router;
