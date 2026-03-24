import { useAuth } from '../contexts/AuthContext';
import { playMuteSound, playUnmuteSound, playDeafenSound, playUndeafenSound } from '../lib/audio';

export default function UserBar({ isMuted, isDeaf, onToggleMute, onToggleDeaf }) {
  const { profile, signOut } = useAuth();

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="user-bar">
      <div className="user-bar-avatar" style={{ backgroundColor: getAvatarColor(profile?.id) }}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" />
        ) : (
          getInitial(profile?.username || '')
        )}
        <div className="status-indicator online" />
      </div>
      <div className="user-bar-info">
        <div className="user-bar-name">{profile?.username || 'User'}</div>
        <div className="user-bar-status">В сети</div>
      </div>
      <div className="user-bar-actions">
        <button 
          className="user-bar-btn" 
          data-tooltip={isMuted ? "Включить микрофон" : "Выключить микрофон"}
          onClick={() => {
            if (isMuted) playUnmuteSound();
            else playMuteSound();
            if (onToggleMute) onToggleMute();
          }}
          style={{ color: isMuted ? 'var(--status-dnd)' : 'currentColor' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            {isMuted && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
        <button 
          className="user-bar-btn" 
          data-tooltip={isDeaf ? "Включить звук" : "Отключить звук"}
          onClick={() => {
            if (isDeaf) playUndeafenSound();
            else playDeafenSound();
            if (onToggleDeaf) onToggleDeaf();
          }}
          style={{ color: isDeaf ? 'var(--status-dnd)' : 'currentColor' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
            {isDeaf && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
        <button className="user-bar-btn" onClick={signOut} data-tooltip="Выйти">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87a.488.488 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
