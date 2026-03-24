import { useState } from 'react';
import UserBar from './UserBar';

export default function ChannelSidebar({ server, channels, activeChannelId, onSelectChannel, onCreateChannel, onInvite }) {
  return (
    <div className="channel-sidebar">
      <div className="server-header">
        <h3>{server?.name || 'Сервер'}</h3>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--text-normal)" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={onInvite} title="Пригласить людей">
          <path d="M14 8h-2V6a1 1 0 00-2 0v2H8a1 1 0 000 2h2v2a1 1 0 002 0v-2h2a1 1 0 000-2zM6 10a4 4 0 110-8 4 4 0 010 8zm0 2c-2.67 0-8 1.34-8 4v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.66-5.33-4-8-4z"/>
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
