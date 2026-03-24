import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ChannelSidebar({ server, channels, activeChannelId, activeVoiceChannel, voiceParticipants, onSelectChannel, onCreateChannel, onInvite }) {
  const { user } = useAuth();
  const [showCreateVoice, setShowCreateVoice] = useState(false);
  const [voiceName, setVoiceName] = useState('');

  const handleCreateVoice = async () => {
    if (!voiceName.trim() || !server) return;
    const { data } = await supabase
      .from('channels')
      .insert({
        server_id: server.id,
        name: voiceName.trim(),
        type: 'voice',
        position: channels.length
      })
      .select()
      .single();
    if (data) {
      setVoiceName('');
      setShowCreateVoice(false);
      // Channels will be refreshed by parent
      window.location.reload();
    }
  };

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  return (
    <div className="channel-sidebar">
      <div className="server-header">
        <h3>{server?.name || 'Сервер'}</h3>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--text-normal)" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={onInvite} data-tooltip="Пригласить людей">
          <path d="M14 8h-2V6a1 1 0 00-2 0v2H8a1 1 0 000 2h2v2a1 1 0 002 0v-2h2a1 1 0 000-2zM6 10a4 4 0 110-8 4 4 0 010 8zm0 2c-2.67 0-8 1.34-8 4v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>

      <div className="channel-list">
        {/* Text channels */}
        <div className="channel-category">
          <div className="category-header">
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4.5L6 8.5L10 4.5H2Z"/>
            </svg>
            <span>Текстовые каналы</span>
            <span className="add-channel-btn" onClick={(e) => { e.stopPropagation(); onCreateChannel(); }} data-tooltip="Создать канал">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M15 9.75H9.75V15H8.25V9.75H3V8.25H8.25V3H9.75V8.25H15V9.75Z"/>
              </svg>
            </span>
          </div>
          {textChannels.map(channel => (
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

        {/* Voice channels */}
        <div className="channel-category">
          <div className="category-header">
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4.5L6 8.5L10 4.5H2Z"/>
            </svg>
            <span>Голосовые каналы</span>
            <span className="add-channel-btn" onClick={(e) => { e.stopPropagation(); setShowCreateVoice(true); }} data-tooltip="Создать голос. канал">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M15 9.75H9.75V15H8.25V9.75H3V8.25H8.25V3H9.75V8.25H15V9.75Z"/>
              </svg>
            </span>
          </div>
          {voiceChannels.map(channel => {
            const isActiveVoice = activeVoiceChannel?.id === channel.id;
            const participants = voiceParticipants[channel.id] || {};
            return (
              <div key={channel.id}>
                <div
                  className={`channel-item ${activeChannelId === channel.id ? 'active' : ''} ${isActiveVoice ? 'connected' : ''}`}
                  onClick={() => onSelectChannel(channel.id)}
                >
                  <span className="channel-hash">🔊</span>
                  <span className="channel-name">{channel.name}</span>
                </div>
                {isActiveVoice && Object.keys(participants).length > 0 && (
                  <div className="voice-users-list">
                    {Object.entries(participants).map(([uid, state]) => (
                      <div key={uid} className="voice-user-item">
                        <div className="voice-user-avatar" style={{ backgroundColor: '#5865f2' }}>
                          {uid.substring(0, 2).toUpperCase()}
                          {state.isMuted && <span className="voice-user-mute">🔇</span>}
                        </div>
                        <span className="voice-user-name">{uid === user?.id ? 'Ты' : 'Пользователь ' + uid.substring(0, 4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {voiceChannels.length === 0 && !showCreateVoice && (
            <div className="channel-item" style={{ opacity: 0.4, cursor: 'default', fontSize: 12 }}>
              Нет голосовых каналов
            </div>
          )}
        </div>
      </div>

      {/* Create voice channel inline */}
      {showCreateVoice && (
        <div className="modal-overlay" onClick={() => setShowCreateVoice(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Голосовой канал</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Имя канала <span className="required">*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', borderRadius: 4, padding: '0 12px' }}>
                  <span style={{ fontSize: 18 }}>🔊</span>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={e => setVoiceName(e.target.value)}
                    placeholder="голосовой"
                    onKeyDown={e => e.key === 'Enter' && handleCreateVoice()}
                    autoFocus
                    style={{ background: 'transparent', border: 'none' }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateVoice(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleCreateVoice} disabled={!voiceName.trim()}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
