import { Router } from "express";
import { getHome, getChannels, getOrgDetails, createChannel, updateChannel, getMessages, banMember, unbanMember, updateUserProfile, getOrgMembers, getDMs, getGlobalDMs, createDM, getRoles, createRole, updateRole, deleteRole, updateMemberRoles, initializeOrg, getPublicOrgs, joinByCode, regenerateJoinCode, getWorkspaceEmojis, createWorkspaceEmoji, deleteWorkspaceEmoji, updateOrganization } from "../handlers/api-handler.js";
import { requireAuth, requireOrgMember, requireOrgAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", getHome);

router.post("/user/profile", requireAuth, updateUserProfile);
router.get("/user/dms", requireAuth, getGlobalDMs);

// Global Org Discovery
router.get("/orgs/public", requireAuth, getPublicOrgs);
router.post("/orgs/join-code", requireAuth, joinByCode);
router.post("/orgs/:orgId/join-code/regenerate", requireAuth, requireOrgMember, requireOrgAdmin, regenerateJoinCode);

// Workspace Management
router.get("/orgs/:orgId", requireAuth, requireOrgMember, getOrgDetails);
router.put("/orgs/:orgId", requireAuth, requireOrgMember, requireOrgAdmin, updateOrganization);

// Workspace Emojis
router.get("/orgs/:orgId/emojis", requireAuth, requireOrgMember, getWorkspaceEmojis);
router.post("/orgs/:orgId/emojis", requireAuth, requireOrgMember, requireOrgAdmin, createWorkspaceEmoji);
router.delete("/orgs/:orgId/emojis/:emojiId", requireAuth, requireOrgMember, requireOrgAdmin, deleteWorkspaceEmoji);

// Organization Rooms & Channels
router.post("/orgs/:orgId/init", requireAuth, requireOrgMember, initializeOrg);
router.get("/orgs/:orgId/channels", requireAuth, requireOrgMember, getChannels);
router.get("/orgs/:orgId/members", requireAuth, requireOrgMember, getOrgMembers);
router.get("/orgs/:orgId/dms", requireAuth, requireOrgMember, getDMs);
router.post("/orgs/:orgId/dms", requireAuth, requireOrgMember, createDM);
router.post("/orgs/:orgId/channels", requireAuth, requireOrgMember, createChannel);
router.put("/orgs/:orgId/channels/:channelId", requireAuth, requireOrgMember, updateChannel);

// Role Management
router.get("/orgs/:orgId/roles", requireAuth, requireOrgMember, getRoles);
router.post("/orgs/:orgId/roles", requireAuth, requireOrgMember, requireOrgAdmin, createRole);
router.put("/orgs/:orgId/roles/:roleId", requireAuth, requireOrgMember, requireOrgAdmin, updateRole);
router.delete("/orgs/:orgId/roles/:roleId", requireAuth, requireOrgMember, requireOrgAdmin, deleteRole);
router.put("/orgs/:orgId/members/:memberId/roles", requireAuth, requireOrgMember, requireOrgAdmin, updateMemberRoles);

router.get("/orgs/:orgId/channels/:channelId/messages", requireAuth, requireOrgMember, getMessages);

// Moderation 
router.put("/orgs/:orgId/members/:memberId/ban", requireAuth, requireOrgMember, requireOrgAdmin, banMember);
router.put("/orgs/:orgId/members/:memberId/unban", requireAuth, requireOrgMember, requireOrgAdmin, unbanMember);

export default router;
