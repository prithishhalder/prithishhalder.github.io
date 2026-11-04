import React, { useEffect, useState } from 'react';

const FALLBACK_FEED = [
  { source: 'Nature Astronomy', color: 'var(--accent-red)', title: 'James Webb Space Telescope reveals new atmospheric features on Exoplanet K2-18 b', link: 'https://www.nature.com/natastron' },
  { source: 'ApJ', color: 'var(--accent-blue)', title: 'Discovery of a potentially habitable super-Earth around a nearby M-dwarf star', link: 'https://aasnova.org' },
  { source: 'MNRAS', color: 'var(--accent-cyan)', title: 'High-resolution spectroscopic analysis of pristine cometary structures', link: 'https://academic.oup.com/mnras' },
  { source: 'arXiv (astro-ph)', color: 'var(--accent-orange)', title: 'A massive quiescent galaxy at redshift 4.65 observed by JWST', link: 'https://arxiv.org/abs/astro-ph.EP' },
  { source: 'Science', color: 'var(--accent-purple)', title: 'Observation of solar flare precursor magnetic helicity patterns', link: 'https://www.science.org' }
];

export default function ArticleTicker() {
  const [items, setItems] = useState(FALLBACK_FEED);

  useEffect(() => {
    let isMounted = true;
    async function fetchFeeds() {
      const cached = sessionStorage.getItem('journalTickerData');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            return;
          }
        } catch (e) {}
      }

      const feeds = [
        { name: 'Nature Astronomy', url: 'https://www.nature.com/natastron.rss', color: 'var(--accent-red)' },
        { name: 'ApJ', url: 'https://aasnova.org/feed/', color: 'var(--accent-blue)' },
        { name: 'arXiv', url: 'https://export.arxiv.org/rss/astro-ph.EP', color: 'var(--accent-orange)' }
      ];

      try {
        let allItems = [];
        for (const feed of feeds) {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
          const data = await response.json();
          if (data && data.status === 'ok' && data.items) {
            const batch = data.items.slice(0, 3).map(item => ({
              title: item.title,
              link: item.link,
              source: feed.name,
              color: feed.color
            }));
            allItems = allItems.concat(batch);
          }
        }

        if (isMounted && allItems.length > 0) {
          setItems(allItems);
          sessionStorage.setItem('journalTickerData', JSON.stringify(allItems));
        }
      } catch (err) {
        console.warn('Using fallback news feed for ticker:', err);
      }
    }

    fetchFeeds();
    return () => { isMounted = false; };
  }, []);

  const displayItems = [...items, ...items];

  return (
    <div style={{
      width: '100%',
      marginTop: '1.25rem',
      borderRadius: '4px',
      border: '1px solid var(--border-line)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      boxShadow: 'none',
      height: '46px'
    }}>
      {/* Ticker Lead Tag */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '0 18px',
        height: '100%',
        borderRight: '1px solid var(--border-line)',
        color: 'var(--accent-cyan)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '0.85rem',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 2
      }}>
        <span style={{color: 'var(--accent-red)', fontSize: '0.9rem'}}>●</span> DISPATCHES //
      </div>

      {/* Marquee Wrapper */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        maskImage: 'linear-gradient(to right, transparent, black 25px, black 95%, transparent)'
      }}>
        <div className="terminal-ticker-track">
          {displayItems.map((item, index) => (
            <div key={index} className="terminal-ticker-item">
              {/* Badge Styled Exactly Like the IF / Q / SJR Badges */}
              <span 
                className="om-badge" 
                style={{
                  color: item.color || 'var(--accent-blue)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '2px 9px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  letterSpacing: '0.02em',
                  flexShrink: 0
                }}>
                {item.source}
              </span>

              {/* Larger, Crisp Article Title */}
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{
                  color: 'var(--text-main)', 
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.98rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--ifm-color-primary)';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.textDecoration = 'none';
                }}>
                {item.title}
              </a>

              {/* Terminal Separator Glyph */}
              <span style={{color: 'var(--border-dim)', opacity: 0.6, fontSize: '0.8rem', userSelect: 'none', marginLeft: '1rem'}}>
                ///
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
