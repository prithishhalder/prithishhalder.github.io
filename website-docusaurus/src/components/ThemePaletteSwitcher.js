import React, { useEffect, useState } from 'react';

const DARK_THEMES = [
  { id: 'tokyo-night', name: 'Tokyo Night', color: '#7aa2f7' },
  { id: 'catppuccin', name: 'Catppuccin', color: '#cba6f7' },
  { id: 'gruvbox', name: 'Gruvbox', color: '#fe8019' },
  { id: 'kanagawa', name: 'Kanagawa', color: '#7e9cd8' },
  { id: 'rose-pine', name: 'Rosé Pine', color: '#eb6f92' }
];

export default function ThemePaletteSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('tokyo-night');
  const [isLightMode, setIsLightMode] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Observe Docusaurus data-theme attribute on <html> (light vs dark)
    const checkDocusaurusMode = () => {
      const mode = document.documentElement.getAttribute('data-theme');
      setIsLightMode(mode === 'light');
    };
    checkDocusaurusMode();

    const observer = new MutationObserver(checkDocusaurusMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const saved = localStorage.getItem('omarchy-theme') || 'tokyo-night';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-omarchy-theme', saved);

    const handleKeyDown = (e) => {
      if (e.key === 't' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        cycleNextTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectTheme = (id) => {
    setCurrentTheme(id);
    document.documentElement.setAttribute('data-omarchy-theme', id);
    localStorage.setItem('omarchy-theme', id);
    setOpen(false);
  };

  const cycleNextTheme = () => {
    const saved = localStorage.getItem('omarchy-theme') || 'tokyo-night';
    const currentIndex = DARK_THEMES.findIndex(t => t.id === saved);
    const nextTheme = DARK_THEMES[(currentIndex + 1) % DARK_THEMES.length];
    selectTheme(nextTheme.id);
  };

  if (isLightMode) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '4px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-line)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-subtle)'
      }}>
        <span style={{width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb'}} />
        <span>Light Mode</span>
      </div>
    );
  }

  return (
    <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center'}}>
      <button
        onClick={() => setOpen(!open)}
        title="Press 't' to cycle themes"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-line)',
          color: 'var(--text-main)',
          padding: '4px 10px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          cursor: 'pointer'
        }}>
        <span style={{
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: DARK_THEMES.find(t => t.id === currentTheme)?.color || '#7aa2f7'
        }} />
        <span>{DARK_THEMES.find(t => t.id === currentTheme)?.name || 'Theme'}</span>
        <span style={{opacity: 0.5, fontSize: '0.7rem'}}>[t]</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-line)',
          borderRadius: '4px',
          padding: '4px',
          zIndex: 1000,
          minWidth: '140px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
        }}>
          {DARK_THEMES.map(theme => (
            <div
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                background: currentTheme === theme.id ? 'var(--bg-surface)' : 'transparent',
                color: currentTheme === theme.id ? 'var(--ifm-color-primary)' : 'var(--text-main)'
              }}>
              <span style={{
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: theme.color 
              }} />
              <span>{theme.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
