import React, { useState } from 'react';
import { acmTheme } from '../../lib/theme';

export default function RoomModal({ open, onClose, onCreate }) {
  const [roomName, setRoomName] = useState('');
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
        padding: '2.5rem 2rem',
        minWidth: 340,
        boxShadow: '0 4px 24px #0002',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: acmTheme.colors.primary }}>Create New Room</div>
        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
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
        />
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
          <button
            onClick={() => { if (roomName.trim()) { onCreate(roomName); setRoomName(''); } }}
            style={{
              background: acmTheme.colors.primary,
              color: acmTheme.colors.surface,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >Create</button>
        </div>
      </div>
    </div>
  );
}
