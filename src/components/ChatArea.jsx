import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import VoiceChannel from './VoiceChannel';

export default function ChatArea({ channel, serverId }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [profiles, setProfiles] = useState({});
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  useEffect(() => {
    if (!channel) return;
    setMessages([]);
    setReplyTo(null);

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data) {
        setMessages(data);
        const userIds = [...new Set(data.map(m => m.user_id))];
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          if (profs) {
            const map = {};
            profs.forEach(p => map[p.id] = p);
            setProfiles(prev => ({ ...prev, ...map }));
          }
        }
      }
      setTimeout(scrollToBottom, 100);
    };

    loadMessages();

    const subscription = supabase
      .channel(`messages:${channel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, async (payload) => {
        const msg = payload.new;
        if (!profiles[msg.user_id]) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', msg.user_id)
            .single();
          if (prof) {
            setProfiles(prev => ({ ...prev, [prof.id]: prof }));
          }
        }
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !channel) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    const replyId = replyTo?.id || null;
    setReplyTo(null);

    await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: user.id,
      content: msgText,
      reply_to: replyId
    });
  };

  const handleEdit = async (msgId) => {
    if (!editText.trim()) return;
    await supabase.from('messages')
      .update({ content: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', msgId);
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (msgId) => {
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const startReply = (msg) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Сегодня в ${time}`;
    return `${d.toLocaleDateString('ru')} ${time}`;
  };

  const formatShortTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowHeader = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    if (prev.user_id !== msg.user_id) return true;
    const diff = new Date(msg.created_at) - new Date(prev.created_at);
    return diff > 7 * 60 * 1000;
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  // Find the replied-to message
  const getRepliedMessage = (replyId) => {
    if (!replyId) return null;
    return messages.find(m => m.id === replyId);
  };

  if (!channel) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <h3>Выбери канал</h3>
          <p>Выбери текстовый канал из списка слева, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  // Voice channel view
  if (channel.type === 'voice') {
    return (
      <div className="chat-area">
        <VoiceChannel channel={channel} onLeave={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <span className="channel-hash-icon">#</span>
        <span className="channel-title">{channel.name}</span>
        {channel.topic && <span className="channel-topic">{channel.topic}</span>}
      </div>

      <div className="messages-area" ref={messagesAreaRef}>
        <div className="messages-container">
          <div className="channel-welcome">
            <div className="welcome-hash">#</div>
            <h1>Добро пожаловать в #{channel.name}!</h1>
            <p>Это начало канала #{channel.name}.</p>
          </div>

          {messages.map((msg, idx) => {
            const showHeader = shouldShowHeader(msg, idx);
            const author = profiles[msg.user_id];
            const authorName = author?.display_name || author?.username || 'Unknown';
            const isOwn = msg.user_id === user?.id;
            const repliedMsg = getRepliedMessage(msg.reply_to);
            const repliedAuthor = repliedMsg ? profiles[repliedMsg.user_id] : null;

            return (
              <div key={msg.id} className={`message-group ${showHeader ? 'has-header' : ''}`}>
                {/* Reply reference */}
                {repliedMsg && (
                  <div className="message-reply-ref">
                    <div className="reply-line" />
                    <div className="reply-avatar-small" style={{ backgroundColor: getAvatarColor(repliedMsg.user_id) }}>
                      {getInitial(repliedAuthor?.username)}
                    </div>
                    <span className="reply-author" style={{ color: getAvatarColor(repliedMsg.user_id) }}>
                      {repliedAuthor?.display_name || repliedAuthor?.username || 'Unknown'}
                    </span>
                    <span className="reply-content-preview">
                      {repliedMsg.content.length > 60 ? repliedMsg.content.slice(0, 60) + '...' : repliedMsg.content}
                    </span>
                  </div>
                )}

                {showHeader ? (
                  <div className="message-avatar" style={{ backgroundColor: getAvatarColor(msg.user_id) }}>
                    {author?.avatar_url ? (
                      <img src={author.avatar_url} alt="" />
                    ) : (
                      getInitial(authorName)
                    )}
                  </div>
                ) : (
                  <div className="message-avatar-placeholder">
                    <span className="message-hover-time">{formatShortTime(msg.created_at)}</span>
                  </div>
                )}

                <div className="message-content-wrapper">
                  {showHeader && (
                    <div className="message-header">
                      <span className="message-author" style={{ color: getAvatarColor(msg.user_id) }}>
                        {authorName}
                      </span>
                      <span className="message-timestamp">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  
                  {editingId === msg.id ? (
                    <div>
                      <textarea
                        className="edit-message-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleEdit(msg.id);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditText('');
                          }
                        }}
                        autoFocus
                        rows={1}
                      />
                      <div className="edit-hint">
                        Escape для отмены · Enter для сохранения
                      </div>
                    </div>
                  ) : (
                    <div className="message-text">
                      {msg.content}
                      {msg.edited_at && <span className="message-edited"> (ред.)</span>}
                    </div>
                  )}

                  {msg.attachment_url && (
                    <img className="message-attachment" src={msg.attachment_url} alt="attachment" />
                  )}
                </div>

                {editingId !== msg.id && (
                  <div className="message-actions">
                    <button className="message-action-btn" onClick={() => startReply(msg)} title="Ответить">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.598 2.076a.5.5 0 01.052.442L5.805 5.25h4.948a3.25 3.25 0 010 6.5H9.5a.75.75 0 010-1.5h1.253a1.75 1.75 0 000-3.5H5.25l-.19.001.845 2.732a.5.5 0 01-.826.477L1.44 7.232a.75.75 0 010-1.064l3.638-3.228a.5.5 0 01.774.136z"/>
                      </svg>
                    </button>
                    {isOwn && (
                      <>
                        <button className="message-action-btn" onClick={() => startEdit(msg)} title="Изменить">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.293 1.293a1 1 0 011.414 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9z"/>
                          </svg>
                        </button>
                        <button className="message-action-btn" onClick={() => handleDelete(msg.id)} title="Удалить">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        {/* Reply bar */}
        {replyTo && (
          <div className="reply-bar">
            <span className="reply-bar-text">
              Ответ на сообщение <strong>{profiles[replyTo.user_id]?.username || 'Unknown'}</strong>
            </span>
            <button className="reply-bar-close" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}
        <form className="message-input-wrapper" onSubmit={handleSend}>
          <button type="button" className="upload-btn" title="Прикрепить файл">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </button>
          <input
            ref={inputRef}
            className="message-input"
            type="text"
            placeholder={`Написать в #${channel.name}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
              if (e.key === 'Escape' && replyTo) {
                setReplyTo(null);
              }
            }}
          />
        </form>
      </div>
    </div>
  );
}
