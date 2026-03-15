// Role and permission logic
export const Roles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  GUEST: 'guest',
};

export const Permissions = {
  CREATE_ROOM: ['owner', 'admin'],
  DELETE_ROOM: ['owner', 'admin'],
  MANAGE_USERS: ['owner', 'admin'],
  MUTE_USER: ['owner', 'admin', 'moderator'],
  KICK_USER: ['owner', 'admin', 'moderator'],
  SEND_MESSAGE: ['owner', 'admin', 'moderator', 'member'],
  JOIN_ROOM: ['owner', 'admin', 'moderator', 'member', 'guest'],
};

export function hasPermission(role, action) {
  return Permissions[action]?.includes(role);
}
