import React, { useState } from 'react';

// Reusable wrapper: wraps any children, shows `content` on hover,
// and chains optional onMouseEnter/onMouseLeave so parent logic (e.g. setHoveredSection) still runs
export function HoverPopUp({ children, content, onMouseEnter, onMouseLeave }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
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
            height: '250px',
            width: '200px',
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 10,
            pointerEvents: 'none', // wont cause conflicts because of nesting
            background: '#fff',
            border: '1px solid #d4cdc0',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
