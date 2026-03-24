import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import UserBar from './UserBar';

export default function DMSidebar({ conversations, activeConvId, onSelectConversation, onStartDM }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  // Load conversation member profiles
  useEffect(() => {
    const loadProfiles = async () => {
      if (!conversations?.length) return;
      const convIds = conversations.map(c => c.id);
      const { data: members } = await supabase
        .from('dm_members')
        .select('*, profile:profiles(*)')
        .in('conversation_id', convIds);
      
      if (members) {
        const map = {};
        members.forEach(m => {
          if (m.user_id !== user.id && m.profile) {
            map[m.conversation_id] = m.profile;
          }
        });
        setProfiles(map);
      }
    };
    loadProfiles();
  }, [conversations, user?.id]);

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(50);
    if (data) setAllUsers(data);
    setShowUsers(true);
  };

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  return (
    <div className="channel-sidebar">
      <div className="server-header">
        <h3>Личные сообщения</h3>
      </div>

      <div className="dm-find">
        <input className="dm-find-input" placeholder="Найти или начать беседу" readOnly onClick={loadAllUsers} />
      </div>

      <div className="dm-list">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
          <span className="dm-header-title">Личные сообщения</span>
          <span
            style={{ color: 'var(--channel-icon)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
            onClick={loadAllUsers}
            title="Новое сообщение"
          >+</span>
        </div>

        {conversations.map(conv => {
          const otherUser = profiles[conv.id];
          return (
            <div
              key={conv.id}
              className={`dm-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="dm-item-avatar" style={{ backgroundColor: getAvatarColor(otherUser?.id) }}>
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" />
                ) : (
                  getInitial(otherUser?.username)
                )}
              </div>
              <span className="dm-item-name">
                {otherUser?.display_name || otherUser?.username || 'Unknown'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Show all users panel */}
      {showUsers && (
        <div className="modal-overlay" onClick={() => setShowUsers(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новое сообщение</h2>
              <p>Выбери пользователя для отправки сообщения</p>
            </div>
            <div className="modal-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {allUsers.map(u => (
                <div
                  key={u.id}
                  className="member-item"
                  onClick={() => {
                    onStartDM(u.id);
                    setShowUsers(false);
                  }}
                >
                  <div className="member-avatar" style={{ backgroundColor: getAvatarColor(u.id) }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" />
                    ) : (
                      getInitial(u.username)
                    )}
                  </div>
                  <span className="member-name">{u.display_name || u.username}</span>
                </div>
              ))}
              {allUsers.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  Пока нет других пользователей
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUsers(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      <UserBar />
    </div>
  );
}
