import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <img src="/logo.png" alt="MetaCord" className="landing-logo-img" />
            <span>MetaCord</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features">Возможности</a>
            <a href="#safety">Безопасность</a>
            <a href="#support">Поддержка</a>
          </div>
          <Link to={user ? '/channels' : '/login'} className="landing-nav-btn">
            {user ? 'Открыть MetaCord' : 'Войти'}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-bg"></div>
        <div className="landing-hero-content">
          <h1>МЕСТО, ГДЕ ТЕБЕ РАДЫ</h1>
          <p className="landing-hero-subtitle">
            MetaCord — это место, где можно общаться с друзьями, сообществами и игроками. 
            Создавай серверы, делись мыслями и будь на связи — бесплатно.
          </p>
          <div className="landing-hero-buttons">
            <Link to="/register" className="landing-btn landing-btn-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 8}}>
                <path d="M16.59 9H15V4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H7.41c-.89 0-1.34 1.08-.71 1.71l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.63-.63.19-1.71-.7-1.71z"/>
                <path d="M5 19c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1z"/>
              </svg>
              Зарегистрироваться
            </Link>
            <Link to={user ? '/channels' : '/login'} className="landing-btn landing-btn-dark">
              Открыть MetaCord в браузере
            </Link>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="landing-float landing-float-1"></div>
        <div className="landing-float landing-float-2"></div>
        <div className="landing-float landing-float-3"></div>
      </section>

      {/* Features Section */}
      <section className="landing-section landing-section-dark" id="features">
        <div className="landing-section-inner landing-feature">
          <div className="landing-feature-text">
            <h2>Создавай место, где вы будете свои</h2>
            <p>
              Серверы MetaCord организованы по темам, каналам и разделам. 
              Здесь можно обсуждать что угодно: от матча до дизайна. 
              Найди сообщество по интересам или создай своё.
            </p>
          </div>
          <div className="landing-feature-visual">
            <div className="landing-mockup">
              <div className="mockup-server-bar">
                <div className="mockup-server-icon active"></div>
                <div className="mockup-server-icon"></div>
                <div className="mockup-server-icon"></div>
                <div className="mockup-server-icon add">+</div>
              </div>
              <div className="mockup-channels">
                <div className="mockup-channel-header">Мой сервер</div>
                <div className="mockup-channel active"># общий</div>
                <div className="mockup-channel"># игры</div>
                <div className="mockup-channel"># музыка</div>
              </div>
              <div className="mockup-chat">
                <div className="mockup-message">
                  <div className="mockup-msg-avatar"></div>
                  <div className="mockup-msg-content">
                    <span className="mockup-msg-name">Игрок</span>
                    <span className="mockup-msg-text">Погнали играть? 🎮</span>
                  </div>
                </div>
                <div className="mockup-message">
                  <div className="mockup-msg-avatar" style={{background:'#57f287'}}></div>
                  <div className="mockup-msg-content">
                    <span className="mockup-msg-name" style={{color:'#57f287'}}>Друг</span>
                    <span className="mockup-msg-text">Давай! Уже захожу 🚀</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-light" id="safety">
        <div className="landing-section-inner landing-feature landing-feature-reverse">
          <div className="landing-feature-text">
            <h2>Общайся так, как удобно тебе</h2>
            <p>
              Текстовые каналы, личные сообщения, реакции и многое другое. 
              Делись мемами. Обсуждай стратегии. Планируй вечера. 
              Всё в одном месте.
            </p>
          </div>
          <div className="landing-feature-visual">
            <div className="landing-chat-demo">
              <div className="demo-bubble demo-bubble-left">
                <strong>Привет!</strong> Как дела?
              </div>
              <div className="demo-bubble demo-bubble-right">
                Отлично! Ты видел новый трейлер? 🎬
              </div>
              <div className="demo-bubble demo-bubble-left">
                Да, просто огонь! 🔥🔥🔥
              </div>
              <div className="demo-bubble demo-bubble-right">
                Скинуть ссылку в <span style={{color:'var(--text-link)'}}>#кино</span>?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Готов начать своё путешествие?</h2>
          <p>Присоединяйся к MetaCord — это бесплатно!</p>
          <Link to="/register" className="landing-btn landing-btn-brand">
            Зарегистрироваться
          </Link>
        </div>
        <div className="landing-cta-sparkles">
          <div className="sparkle sparkle-1">✦</div>
          <div className="sparkle sparkle-2">✦</div>
          <div className="sparkle sparkle-3">✦</div>
          <div className="sparkle sparkle-4">✦</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/logo.png" alt="MetaCord" style={{width: 40, height: 40}} />
            <span style={{fontSize: 18, fontWeight: 700, color: 'var(--brand-500)'}}>MetaCord</span>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <h4>Продукт</h4>
              <a href="#features">Возможности</a>
              <a href="#safety">Безопасность</a>
            </div>
            <div className="landing-footer-col">
              <h4>Компания</h4>
              <a href="#">О нас</a>
              <a href="#">Карьера</a>
            </div>
            <div className="landing-footer-col">
              <h4>Ресурсы</h4>
              <a href="#support">Поддержка</a>
              <a href="#">Блог</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 MetaCord. Все права защищены.</span>
        </div>
      </footer>
    </div>
  );
}
