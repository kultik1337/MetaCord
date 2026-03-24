import { useState } from 'react';

export function CreateServerModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создай свой сервер</h2>
          <p>Твой сервер — это место, где ты общаешься с друзьями.</p>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Имя сервера <span className="required">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой крутой сервер"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Создаём...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JoinServerModal({ onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    const result = await onJoin(inviteCode.trim());
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Присоединиться к серверу</h2>
          <p>Введи код приглашения, чтобы присоединиться к серверу.</p>
        </div>
        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Код приглашения <span className="required">*</span></label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Вставь код приглашения"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading || !inviteCode.trim()}>
            {loading ? 'Входим...' : 'Присоединиться'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateChannelModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim().toLowerCase().replace(/\s+/g, '-'));
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать канал</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Имя канала <span className="required">*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', borderRadius: 4, padding: '0 12px' }}>
              <span style={{ color: 'var(--channel-icon)', fontSize: 20 }}>#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="новый-канал"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                style={{ background: 'transparent', border: 'none' }}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Создаём...' : 'Создать канал'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InviteModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(server.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Пригласи друзей на {server.name}</h2>
          <p>Отправь друзьям этот код приглашения</p>
        </div>
        <div className="modal-body">
          <div className="invite-code-display">
            <span className="invite-code-text">{server.invite_code}</span>
            <button className={`invite-copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
