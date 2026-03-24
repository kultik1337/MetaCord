import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function FriendsView({ onStartDM }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('online');
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    loadFriends();

    const sub = supabase
      .channel('friendships-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadFriends();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user?.id]);

  const loadFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*, sender:profiles!friendships_sender_id_fkey(*), receiver:profiles!friendships_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!data) return;

    const accepted = [];
    const inc = [];
    const out = [];

    data.forEach(f => {
      if (f.status === 'accepted') {
        const friend = f.sender_id === user.id ? f.receiver : f.sender;
        accepted.push({ ...f, friend });
      } else if (f.status === 'pending') {
        if (f.receiver_id === user.id) {
          inc.push({ ...f, friend: f.sender });
        } else {
          out.push({ ...f, friend: f.receiver });
        }
      }
    });

    setFriends(accepted);
    setPending(inc);
    setOutgoing(out);
  };

  const handleAddFriend = async () => {
    setAddError('');
    setAddSuccess('');
    if (!searchName.trim()) return;

    const { data: found } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', searchName.trim())
      .single();

    if (!found) {
      setAddError('Пользователь не найден');
      return;
    }
    if (found.id === user.id) {
      setAddError('Нельзя добавить себя');
      return;
    }

    // Check existing
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${found.id}),and(sender_id.eq.${found.id},receiver_id.eq.${user.id})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') setAddError('Вы уже друзья!');
      else if (existing.status === 'pending') setAddError('Заявка уже отправлена');
      else setAddError('Не удалось отправить заявку');
      return;
    }

    const { error } = await supabase.from('friendships').insert({
      sender_id: user.id,
      receiver_id: found.id,
      status: 'pending'
    });

    if (error) {
      setAddError('Ошибка при отправке заявки');
    } else {
      setAddSuccess(`Заявка отправлена ${found.username}!`);
      setSearchName('');
      loadFriends();
    }
  };

  const handleAccept = async (id) => {
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id);
    loadFriends();
  };

  const handleDecline = async (id) => {
    await supabase.from('friendships').delete().eq('id', id);
    loadFriends();
  };

  const handleRemove = async (id) => {
    await supabase.from('friendships').delete().eq('id', id);
    loadFriends();
  };

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  const onlineFriends = friends.filter(f => f.friend?.status === 'online');
  const allFriends = friends;

  const tabs = [
    { id: 'online', label: 'В сети', count: onlineFriends.length },
    { id: 'all', label: 'Все', count: allFriends.length },
    { id: 'pending', label: 'Ожидание', count: pending.length + outgoing.length },
    { id: 'add', label: 'Добавить друга', special: true },
  ];

  const renderFriend = (f, showActions = false) => (
    <div key={f.id} className="friends-item">
      <div className="friends-item-left">
        <div className="friends-avatar" style={{ backgroundColor: getAvatarColor(f.friend?.id) }}>
          {f.friend?.avatar_url ? <img src={f.friend.avatar_url} alt="" /> : getInitial(f.friend?.username)}
          <span className={`friends-status-dot ${f.friend?.status || 'offline'}`} />
        </div>
        <div className="friends-info">
          <span className="friends-name">{f.friend?.display_name || f.friend?.username || 'Unknown'}</span>
          <span className="friends-status-text">{f.friend?.custom_status || f.friend?.status || 'Оффлайн'}</span>
        </div>
      </div>
      <div className="friends-actions">
        {showActions ? (
          <>
            <button className="friends-action-btn accept" onClick={() => handleAccept(f.id)} title="Принять">✓</button>
            <button className="friends-action-btn decline" onClick={() => handleDecline(f.id)} title="Отклонить">✕</button>
          </>
        ) : (
          <>
            <button className="friends-action-btn" onClick={() => onStartDM(f.friend?.id)} title="Написать">💬</button>
            <button className="friends-action-btn decline" onClick={() => handleRemove(f.id)} title="Удалить">✕</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="friends-view">
      <div className="friends-header">
        <span className="friends-icon">👥</span>
        <span className="friends-title">Друзья</span>
        <div className="friends-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`friends-tab ${tab === t.id ? 'active' : ''} ${t.special ? 'special' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count > 0 && <span className="friends-tab-badge">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="friends-content">
        {tab === 'add' && (
          <div className="friends-add-section">
            <h3>Добавить друга</h3>
            <p>Можешь добавить друга по имени пользователя MetaCord.</p>
            <div className="friends-add-form">
              <input
                type="text"
                placeholder="Введи имя пользователя"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
              />
              <button className="btn btn-primary" onClick={handleAddFriend} disabled={!searchName.trim()}>
                Отправить заявку
              </button>
            </div>
            {addError && <div className="friends-add-error">{addError}</div>}
            {addSuccess && <div className="friends-add-success">{addSuccess}</div>}
          </div>
        )}

        {tab === 'online' && (
          <>
            <div className="friends-section-title">В СЕТИ — {onlineFriends.length}</div>
            {onlineFriends.length === 0 ? (
              <div className="friends-empty">Никого нет в сети. Может, самое время написать кому-нибудь?</div>
            ) : (
              onlineFriends.map(f => renderFriend(f))
            )}
          </>
        )}

        {tab === 'all' && (
          <>
            <div className="friends-section-title">ВСЕ ДРУЗЬЯ — {allFriends.length}</div>
            {allFriends.length === 0 ? (
              <div className="friends-empty">У тебя пока нет друзей. Добавь кого-нибудь!</div>
            ) : (
              allFriends.map(f => renderFriend(f))
            )}
          </>
        )}

        {tab === 'pending' && (
          <>
            {pending.length > 0 && (
              <>
                <div className="friends-section-title">ВХОДЯЩИЕ — {pending.length}</div>
                {pending.map(f => renderFriend(f, true))}
              </>
            )}
            {outgoing.length > 0 && (
              <>
                <div className="friends-section-title">ИСХОДЯЩИЕ — {outgoing.length}</div>
                {outgoing.map(f => (
                  <div key={f.id} className="friends-item">
                    <div className="friends-item-left">
                      <div className="friends-avatar" style={{ backgroundColor: getAvatarColor(f.friend?.id) }}>
                        {getInitial(f.friend?.username)}
                      </div>
                      <div className="friends-info">
                        <span className="friends-name">{f.friend?.username || 'Unknown'}</span>
                        <span className="friends-status-text">Исходящая заявка</span>
                      </div>
                    </div>
                    <div className="friends-actions">
                      <button className="friends-action-btn decline" onClick={() => handleDecline(f.id)} title="Отменить">✕</button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {pending.length === 0 && outgoing.length === 0 && (
              <div className="friends-empty">Нет заявок в друзья</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
