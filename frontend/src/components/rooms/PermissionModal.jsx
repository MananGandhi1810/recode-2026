import React from 'react';
import { acmTheme } from '../../lib/theme';
import { Roles } from '../../lib/permissions';

export default function PermissionModal({ open, onClose, user, onChangeRole }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#0007',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: acmTheme.colors.surface,
        borderRadius: 16,
        padding: '2rem 2rem',
        minWidth: 320,
        boxShadow: '0 4px 24px #0002',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: acmTheme.colors.primary }}>Change Role for {user.name}</div>
        <select
          value={user.role}
          onChange={e => onChangeRole(e.target.value)}
          style={{
            borderRadius: 8,
            border: `1px solid ${acmTheme.colors.muted}`,
            padding: '10px 14px',
            fontSize: 16,
            fontFamily: acmTheme.font.family,
            outline: 'none',
            background: acmTheme.colors.background,
            color: acmTheme.colors.text,
          }}
        >
          {Object.values(Roles).map(role => (
            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: acmTheme.colors.muted,
              color: acmTheme.colors.text,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
