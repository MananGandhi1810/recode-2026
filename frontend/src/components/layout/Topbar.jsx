import React from 'react';
import { acmTheme } from '../../lib/theme';

export default function Topbar({ user, onProfileClick }) {
  return (
    <header style={{
      background: acmTheme.colors.surface,
      color: acmTheme.colors.primary,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      boxShadow: '0 2px 8px #0001',
      fontFamily: acmTheme.font.family,
      zIndex: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
        <span style={{ color: acmTheme.colors.secondary }}>MPSTME ACM</span> Internal
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontWeight: 500 }}>{user.name}</span>
        <button
          onClick={onProfileClick}
          style={{
            background: acmTheme.colors.accent,
            color: acmTheme.colors.primary,
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0002',
          }}
        >
          {user.name[0]}
        </button>
      </div>
    </header>
  );
}
