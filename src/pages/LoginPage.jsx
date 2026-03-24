import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate('/channels', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      navigate('/channels', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/logo.png" alt="MetaCord" style={{ width: 80, height: 80 }} />
        </div>
        <h2>С возвращением!</h2>
        <p className="subtitle">Мы так рады видеть тебя снова!</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль <span className="required">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="auth-btn" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <p className="auth-link">
          Нужен аккаунт? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
