import React from 'react';
import { acmTheme } from '../../lib/theme';
import { hasPermission } from '../../lib/permissions';

export default function UserList({ users, currentUser, userRole, onMute, onKick, onPromote }) {
  return (
    <div style={{
      background: acmTheme.colors.surface,
      borderRadius: 12,
      boxShadow: '0 2px 12px #0001',
      padding: '1rem',
      minWidth: 220,
      maxHeight: 400,
      overflowY: 'auto',
      fontFamily: acmTheme.font.family,
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: acmTheme.colors.primary, marginBottom: 10 }}>Users</div>
      {users.map(user => (
        <div key={user.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 0',
          borderBottom: `1px solid ${acmTheme.colors.muted}`,
        }}>
          <span style={{ fontWeight: user.id === currentUser.id ? 700 : 400, color: user.id === currentUser.id ? acmTheme.colors.secondary : acmTheme.colors.text }}>
            {user.name} {user.id === currentUser.id && '(You)'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {hasPermission(userRole, 'MUTE_USER') && user.id !== currentUser.id && (
              <button onClick={() => onMute(user)} style={iconBtnStyle}>Mute</button>
            )}
            {hasPermission(userRole, 'KICK_USER') && user.id !== currentUser.id && (
              <button onClick={() => onKick(user)} style={iconBtnStyle}>Kick</button>
            )}
            {hasPermission(userRole, 'MANAGE_USERS') && user.id !== currentUser.id && (
              <button onClick={() => onPromote(user)} style={iconBtnStyle}>Promote</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const iconBtnStyle = {
  background: '#f8bbd0',
  color: '#1a237e',
  border: 'none',
  borderRadius: 6,
  padding: '2px 10px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
