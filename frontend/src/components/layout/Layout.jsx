import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({
  user,
  rooms,
  currentRoom,
  onRoomSelect,
  onCreateRoom,
  onProfileClick,
  userRole,
  children,
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f6fa' }}>
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        onRoomSelect={onRoomSelect}
        onCreateRoom={onCreateRoom}
        userRole={userRole}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar user={user} onProfileClick={onProfileClick} />
        <main style={{ flex: 1, overflow: 'auto', padding: '2rem 3vw' }}>{children}</main>
      </div>
    </div>
  );
}
