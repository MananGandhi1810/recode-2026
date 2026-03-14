import { Router } from "express";
import { getHome, getChannels, createChannel, getMessages, updateChannelAccess, banMember, unbanMember } from "../handlers/api-handler.js";
import { requireAuth, requireOrgMember, requireOrgAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", getHome);

// Organization Rooms & Channels
router.get("/orgs/:orgId/channels", requireAuth, requireOrgMember, getChannels);
router.post("/orgs/:orgId/channels", requireAuth, requireOrgMember, createChannel); // requireOrgMember checks if owner/admin inside controller
router.put("/orgs/:orgId/channels/:channelId/access", requireAuth, requireOrgMember, requireOrgAdmin, updateChannelAccess);

router.get("/orgs/:orgId/channels/:channelId/messages", requireAuth, requireOrgMember, getMessages);

// Moderation 
router.put("/orgs/:orgId/members/:memberId/ban", requireAuth, requireOrgMember, requireOrgAdmin, banMember);
router.put("/orgs/:orgId/members/:memberId/unban", requireAuth, requireOrgMember, requireOrgAdmin, unbanMember);

export default router;
