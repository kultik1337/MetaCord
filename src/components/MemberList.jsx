import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MemberList({ serverId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!serverId) return;

    const loadMembers = async () => {
      const { data } = await supabase
        .from('server_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('server_id', serverId);
      
      if (data) setMembers(data);
    };

    loadMembers();
  }, [serverId]);

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  const onlineMembers = members.filter(m => m.profile?.status !== 'offline');
  const offlineMembers = members.filter(m => m.profile?.status === 'offline');

  return (
    <div className="member-list">
      {onlineMembers.length > 0 && (
        <>
          <div className="member-category">В сети — {onlineMembers.length}</div>
          {onlineMembers.map(member => (
            <div key={member.id} className="member-item">
              <div className="member-avatar" style={{ backgroundColor: getAvatarColor(member.user_id) }}>
                {member.profile?.avatar_url ? (
                  <img src={member.profile.avatar_url} alt="" />
                ) : (
                  getInitial(member.profile?.username)
                )}
                <div className={`member-status-dot ${member.profile?.status || 'online'}`} />
              </div>
              <span className="member-name">
                {member.profile?.display_name || member.profile?.username || 'Unknown'}
              </span>
            </div>
          ))}
        </>
      )}

      {offlineMembers.length > 0 && (
        <>
          <div className="member-category">Не в сети — {offlineMembers.length}</div>
          {offlineMembers.map(member => (
            <div key={member.id} className="member-item">
              <div className="member-avatar" style={{ backgroundColor: getAvatarColor(member.user_id), opacity: 0.4 }}>
                {member.profile?.avatar_url ? (
                  <img src={member.profile.avatar_url} alt="" />
                ) : (
                  getInitial(member.profile?.username)
                )}
                <div className="member-status-dot offline" />
              </div>
              <span className="member-name" style={{ opacity: 0.4 }}>
                {member.profile?.display_name || member.profile?.username || 'Unknown'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
