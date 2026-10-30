import { useState } from 'react';

// Reusable wrapper: wraps any children, shows `content` on hover,
// and chains optional onMouseEnter/onMouseLeave so parent logic (e.g. setHoveredSection) still runs
export function HoverPopUp({ children, content, onMouseEnter, onMouseLeave, onClick }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onClick={onClick}
      onMouseEnter={(e) => {
        setIsVisible(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsVisible(false);
        onMouseLeave?.(e);
      }}
    >
      {children}

      {isVisible && content && (
        <div className='chart-hover'
          style={{
            height: '300px',
            width: '700px',
            position: 'absolute',
            top: 0,
            left: 'calc(100% + 21px)', // row width + summary-container padding (20px) + border (1px)
            zIndex: 10,
            pointerEvents: 'none', // wont cause conflicts because of nesting
            background: '#fff',
            border: '1px solid #d4cdc0',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
