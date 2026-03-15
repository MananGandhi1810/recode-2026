import React from 'react';
import { acmTheme } from '../../lib/theme';

export default function ProfileMenu({ user, onLogout, onSettings }) {
  return (
    <div style={{
      position: 'absolute',
      top: 64,
      right: 32,
      background: acmTheme.colors.surface,
      borderRadius: 12,
      boxShadow: '0 2px 12px #0002',
      minWidth: 180,
      zIndex: 100,
      fontFamily: acmTheme.font.family,
      padding: '1rem 0',
    }}>
      <div style={{ padding: '0.5rem 1.5rem', fontWeight: 700, color: acmTheme.colors.primary }}>{user.name}</div>
      <div style={{ padding: '0.5rem 1.5rem', color: acmTheme.colors.text, cursor: 'pointer' }} onClick={onSettings}>Settings</div>
      <div style={{ padding: '0.5rem 1.5rem', color: acmTheme.colors.error, cursor: 'pointer' }} onClick={onLogout}>Logout</div>
    </div>
  );
}
