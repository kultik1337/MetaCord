import { useAuth } from '../contexts/AuthContext';

export default function UserBar() {
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
        <button className="user-bar-btn" onClick={signOut} title="Выйти">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H7C5.897 2 5 2.898 5 4V11H12.586L10.293 8.707C9.902 8.316 9.902 7.684 10.293 7.293C10.684 6.902 11.316 6.902 11.707 7.293L15.707 11.293C16.098 11.684 16.098 12.316 15.707 12.707L11.707 16.707C11.512 16.902 11.256 17 11 17C10.744 17 10.488 16.902 10.293 16.707C9.902 16.316 9.902 15.684 10.293 15.293L12.586 13H5V20C5 21.103 5.897 22 7 22H18C19.103 22 20 21.103 20 20V4C20 2.898 19.103 2 18 2Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
