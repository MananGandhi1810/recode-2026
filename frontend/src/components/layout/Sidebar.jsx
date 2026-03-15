import React from 'react';
import { acmTheme } from '../../lib/theme';

export default function Sidebar({ rooms, currentRoom, onRoomSelect, onCreateRoom, userRole }) {
  return (
    <aside style={{
      background: `linear-gradient(180deg, ${acmTheme.colors.primary} 60%, ${acmTheme.colors.secondary} 100%)`,
      color: acmTheme.colors.surface,
      minWidth: 260,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1rem 1rem 1rem',
      fontFamily: acmTheme.font.family,
      boxShadow: '2px 0 12px #0001',
    }}>
      <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 32, letterSpacing: 1 }}>
        <span style={{ color: acmTheme.colors.accent }}>ACM</span> Chat
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            style={{
              background: room.id === currentRoom ? acmTheme.colors.accent : 'transparent',
              color: room.id === currentRoom ? acmTheme.colors.primary : acmTheme.colors.surface,
              borderRadius: 8,
              padding: '10px 16px',
              marginBottom: 8,
              cursor: 'pointer',
              fontWeight: room.id === currentRoom ? 600 : 400,
              transition: 'background 0.2s',
            }}
          >
            {room.name}
          </div>
        ))}
      </div>
      {(userRole === 'owner' || userRole === 'admin') && (
        <button
          onClick={onCreateRoom}
          style={{
            marginTop: 16,
            background: acmTheme.colors.accent,
            color: acmTheme.colors.primary,
            border: 'none',
            borderRadius: 8,
            padding: '10px 0',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0002',
          }}
        >
          + Create Room
        </button>
      )}
    </aside>
  );
}
