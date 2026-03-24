import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ServerBar({ servers, activeServerId, onSelectServer, onSelectDM, isDMView, onCreateServer, onJoinServer }) {
  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="server-bar">
      {/* DM Button */}
      <div className={`server-icon-wrapper ${isDMView ? 'active' : ''}`} onClick={onSelectDM}>
        {isDMView && <div className="server-pill" />}
        <div className={`server-icon dm-icon ${isDMView ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.73 4.87l-3.98-.64-1.78-3.53a.5.5 0 00-.9.04L11.17 4.2l-4.06.58a.5.5 0 00-.28.86l2.96 2.83-.7 4.01a.5.5 0 00.73.53L13.5 11l3.68 2.01a.5.5 0 00.73-.53l-.7-4.01 2.96-2.83a.5.5 0 00-.28-.86zM5.59 4.73l-.87-.15-.38-.77a.25.25 0 00-.45.02l-.34.76-.88.13a.25.25 0 00-.14.43l.64.62-.15.87a.25.25 0 00.36.27l.79-.41.79.41a.25.25 0 00.36-.27l-.15-.87.64-.62a.25.25 0 00-.14-.43zm17.39 8.09l-.87-.15-.39-.77a.25.25 0 00-.45.02l-.33.76-.89.13a.25.25 0 00-.14.43l.65.62-.16.87a.25.25 0 00.37.27l.78-.41.79.41a.25.25 0 00.37-.27l-.16-.87.65-.62a.25.25 0 00-.14-.43zM22 16.92a1 1 0 00-1.09-.22 6.43 6.43 0 01-9.22-4.56 1 1 0 00-1.93-.17 8.44 8.44 0 006.12 10.1 1 1 0 00.4.08 1 1 0 00.58-.18A8.06 8.06 0 0022 16.92z"/>
          </svg>
        </div>
        <div className="server-tooltip">Личные сообщения</div>
      </div>

      <div className="server-separator" />

      {/* Server list */}
      {servers.map(server => (
        <div
          key={server.id}
          className={`server-icon-wrapper ${activeServerId === server.id ? 'active' : ''}`}
          onClick={() => onSelectServer(server.id)}
        >
          {activeServerId === server.id && <div className="server-pill" />}
          <div
            className={`server-icon ${activeServerId === server.id ? 'active' : ''}`}
            style={!server.icon_url ? { backgroundColor: getAvatarColor(server.id) } : {}}
          >
            {server.icon_url ? (
              <img src={server.icon_url} alt={server.name} />
            ) : (
              getInitials(server.name)
            )}
          </div>
          <div className="server-tooltip">{server.name}</div>
        </div>
      ))}

      <div className="server-separator" />

      {/* Add server */}
      <div className="server-icon-wrapper" onClick={onCreateServer}>
        <div className="server-icon add-server">+</div>
        <div className="server-tooltip">Создать сервер</div>
      </div>

      {/* Join server */}
      <div className="server-icon-wrapper" onClick={onJoinServer}>
        <div className="server-icon add-server" style={{ color: '#23a559' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11.1111H12.8889V4H11.1111V11.1111H4V12.8889H11.1111V20H12.8889V12.8889H20V11.1111Z"/>
          </svg>
        </div>
        <div className="server-tooltip">Присоединиться</div>
      </div>
    </div>
  );
}
