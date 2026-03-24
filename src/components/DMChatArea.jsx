import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function DMChatArea({ conversationId }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [profiles, setProfiles] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    setMessages([]);

    const load = async () => {
      // Load other user profile
      const { data: members } = await supabase
        .from('dm_members')
        .select('*, profile:profiles(*)')
        .eq('conversation_id', conversationId);
      
      if (members) {
        const other = members.find(m => m.user_id !== user.id);
        if (other?.profile) setOtherUser(other.profile);
        const map = {};
        members.forEach(m => { if (m.profile) map[m.user_id] = m.profile; });
        setProfiles(map);
      }

      // Load messages
      const { data: msgs } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (msgs) setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    };

    load();

    // Subscribe
    const sub = supabase
      .channel(`dm:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    await supabase.from('dm_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      content: text
    });
  };

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Сегодня в ${time}`;
    return `${d.toLocaleDateString('ru')} ${time}`;
  };

  const shouldShowHeader = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    if (prev.user_id !== msg.user_id) return true;
    return (new Date(msg.created_at) - new Date(prev.created_at)) > 7 * 60 * 1000;
  };

  if (!conversationId) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <h3>Выбери беседу</h3>
          <p>Или начни новую!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <span style={{ fontSize: 20, color: 'var(--channel-icon)' }}>@</span>
        <span className="channel-title">{otherUser?.display_name || otherUser?.username || '...'}</span>
      </div>

      <div className="messages-area">
        <div className="messages-container">
          {messages.map((msg, idx) => {
            const showHeader = shouldShowHeader(msg, idx);
            const author = profiles[msg.user_id] || (msg.user_id === user.id ? profile : otherUser);
            const authorName = author?.display_name || author?.username || 'Unknown';

            return (
              <div key={msg.id} className={`message-group ${showHeader ? 'has-header' : ''}`}>
                {showHeader ? (
                  <div className="message-avatar" style={{ backgroundColor: getAvatarColor(msg.user_id) }}>
                    {author?.avatar_url ? <img src={author.avatar_url} alt="" /> : getInitial(authorName)}
                  </div>
                ) : (
                  <div className="message-avatar-placeholder" />
                )}
                <div className="message-content-wrapper">
                  {showHeader && (
                    <div className="message-header">
                      <span className="message-author" style={{ color: getAvatarColor(msg.user_id) }}>{authorName}</span>
                      <span className="message-timestamp">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className="message-text">{msg.content}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <form className="message-input-wrapper" onSubmit={handleSend}>
          <input
            className="message-input"
            type="text"
            placeholder={`Написать @${otherUser?.username || '...'}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
        </form>
      </div>
    </div>
  );
}
