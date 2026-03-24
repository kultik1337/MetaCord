import { useState } from 'react';
import UserBar from './UserBar';

export default function ChannelSidebar({ server, channels, activeChannelId, onSelectChannel, onCreateChannel }) {
  return (
    <div className="channel-sidebar">
      <div className="server-header">
        <h3>{server?.name || 'Сервер'}</h3>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--text-normal)" style={{ flexShrink: 0 }}>
          <path d="M5.293 7.293a1 1 0 011.414 0L9 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
        </svg>
      </div>

      <div className="channel-list">
        <div className="channel-category">
          <div className="category-header">
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4.5L6 8.5L10 4.5H2Z"/>
            </svg>
            <span>Текстовые каналы</span>
            <span className="add-channel-btn" onClick={(e) => { e.stopPropagation(); onCreateChannel(); }} title="Создать канал">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M15 9.75H9.75V15H8.25V9.75H3V8.25H8.25V3H9.75V8.25H15V9.75Z"/>
              </svg>
            </span>
          </div>
          {channels.filter(c => c.type === 'text').map(channel => (
            <div
              key={channel.id}
              className={`channel-item ${activeChannelId === channel.id ? 'active' : ''}`}
              onClick={() => onSelectChannel(channel.id)}
            >
              <span className="channel-hash">#</span>
              <span className="channel-name">{channel.name}</span>
            </div>
          ))}
        </div>
      </div>

      <UserBar />
    </div>
  );
}
