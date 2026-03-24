import { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Prevent menu from overflowing screen edges
  const style = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - (items.length * 36 + 16)),
    left: Math.min(x, window.innerWidth - 220),
    zIndex: 9999
  };

  return (
    <div className="context-menu" style={style} ref={menuRef}>
      {items.map((item, idx) => (
        item.divider ? (
          <div key={`div-${idx}`} className="context-menu-divider" />
        ) : (
          <div 
            key={idx} 
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </div>
        )
      ))}
    </div>
  );
}
