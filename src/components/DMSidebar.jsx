import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import UserBar from './UserBar';

export default function DMSidebar({ conversations, activeConvId, onSelectConversation, onStartDM, onShowFriends, showFriends }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState({});
  const [pendingCount, setPendingCount] = useState(0);

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

  // Load pending friend requests count
  useEffect(() => {
    if (!user) return;
    const loadPending = async () => {
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      setPendingCount(count || 0);
    };
    loadPending();

    const sub = supabase
      .channel('pending-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadPending();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user?.id]);

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
        <input className="dm-find-input" placeholder="Найти или начать беседу" readOnly />
      </div>

      <div className="dm-list">
        {/* Friends button */}
        <div
          className={`dm-friends-btn ${showFriends ? 'active' : ''}`}
          onClick={onShowFriends}
        >
          <span className="dm-friends-icon">👥</span>
          <span>Друзья</span>
          {pendingCount > 0 && <span className="dm-friends-badge">{pendingCount}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 4px' }}>
          <span className="dm-header-title">ЛИЧНЫЕ СООБЩЕНИЯ</span>
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

    </div>
  );
}
