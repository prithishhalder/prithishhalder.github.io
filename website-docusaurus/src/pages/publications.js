import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';
import initialPubs from '../data/publications.json';

export default function Publications() {
  const location = useLocation();
  const [sortKey, setSortKey] = useState('year-desc');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync search query from URL parameters if present (e.g. /publications?topic=dust)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topic = params.get('topic') || params.get('q') || params.get('grep') || '';
    if (topic) {
      setSearchQuery(topic);
    }
    const typeParam = params.get('type') || '';
    if (typeParam) {
      setFilterType(typeParam);
    }
  }, [location.search]);

  const processedPubs = useMemo(() => {
    let list = [...initialPubs];

    if (filterType !== 'all') {
      list = list.filter(p => p.type.toLowerCase() === filterType.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.authors.toLowerCase().includes(q) ||
        p.journal.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortKey === 'year-desc') return (b.year || 0) - (a.year || 0) || a.id - b.id;
      if (sortKey === 'citations-desc') return b.citations - a.citations || a.id - b.id;
      if (sortKey === 'if-desc') return b.iff - a.iff || a.id - b.id;
      if (sortKey === 'sjr-desc') return b.sjr - a.sjr || a.id - b.id;
      return a.id - b.id;
    });

    return list;
  }, [sortKey, filterType, searchQuery]);

  return (
    <Layout
      title="Publications // Dr. Prithish Halder"
      description="Peer-reviewed publications, articles, and conference proceedings by Dr. Prithish Halder">
      <main style={{maxWidth: '1040px', margin: '2rem auto 4rem auto', padding: '0 1.5rem'}}>
        
        {/* Terminal Header Info */}
        <div style={{
          borderBottom: '1px solid var(--border-line)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.85rem', marginBottom: '0.4rem'}}>
              // BIBLIOGRAPHY • PEER-REVIEWED ARCHIVE (SQLITE BACKED)
            </div>
            <h1 style={{fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em'}}>
              Publications
            </h1>
            <p style={{color: 'var(--text-muted)', fontSize: '1rem', margin: 0}}>
              Astrophysics, Solar Physics, Light Scattering & Nanomaterials Literature ({processedPubs.length} entries).
            </p>
          </div>

          <a 
            className="button button--secondary" 
            href="pathname:///publications.bib" 
            download 
            style={{fontFamily: 'var(--font-mono)', fontSize: '0.82rem'}}>
            📥 Download BibTeX (.bib)
          </a>
        </div>

        {/* Filter and Command Toolbar */}
        <div style={{
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid var(--border-line)',
          marginBottom: '2rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px'}}>
            <span style={{color: 'var(--accent-green)'}}>❯ grep</span>
            <input
              type="text"
              placeholder="filter query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.8rem',
                borderRadius: '3px',
                border: '1px solid var(--border-line)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-red)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  padding: '0 4px'
                }}
                title="Clear filter">
                ✕
              </button>
            )}
          </div>

          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <span style={{color: 'var(--text-subtle)'}}>type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '3px',
                border: '1px solid var(--border-line)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}>
              <option value="all">all</option>
              <option value="article">article</option>
              <option value="proceeding">proceeding</option>
            </select>
          </div>

          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <span style={{color: 'var(--text-subtle)'}}>sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '3px',
                border: '1px solid var(--border-line)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}>
              <option value="year-desc">year (desc)</option>
              <option value="citations-desc">citations (desc)</option>
              <option value="if-desc">IF (desc)</option>
              <option value="sjr-desc">SJR (desc)</option>
            </select>
          </div>
        </div>

        {/* Publication Cards */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {processedPubs.map((pub) => {
            const authorsHighlighted = pub.authors
              .split(/(P\. Halder|Prithish Halder)/g)
              .map((part, i) => 
                part === 'P. Halder' || part === 'Prithish Halder' ? (
                  <strong key={i} style={{color: 'var(--ifm-color-primary)', textDecoration: 'underline'}}>
                    {part}
                  </strong>
                ) : (
                  part
                )
              );

            return (
              <div 
                key={pub.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                <div style={{
                  fontSize: '1.1rem', 
                  fontWeight: 700, 
                  lineHeight: '1.4', 
                  color: 'var(--text-main)'
                }}>
                  “{pub.title}”
                </div>
                
                <div style={{fontSize: '0.92rem', color: 'var(--text-muted)'}}>
                  {authorsHighlighted}
                </div>

                <div style={{
                  fontSize: '0.88rem', 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--text-subtle)'
                }}>
                  <strong style={{color: 'var(--text-main)'}}>{pub.journal}</strong> {pub.year ? `[${pub.year}]` : ''} — {pub.details}
                </div>

                <div style={{
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '6px', 
                  marginTop: '0.4rem', 
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span className="om-badge" style={{color: pub.type === 'Proceeding' ? 'var(--accent-purple)' : 'var(--accent-cyan)'}}>
                    {pub.type.toLowerCase()}
                  </span>

                  {pub.qStr && (
                    <span className="om-badge" style={{color: 'var(--accent-blue)'}}>
                      {pub.qStr}
                    </span>
                  )}

                  {pub.iff > 0 && (
                    <span className="om-badge" style={{color: 'var(--accent-green)'}}>
                      IF:{pub.iff}
                    </span>
                  )}

                  {pub.sjr > 0 && (
                    <span className="om-badge" style={{color: 'var(--accent-yellow)'}}>
                      SJR:{pub.sjr}
                    </span>
                  )}

                  {pub.citations > 0 && (
                    <span className="om-badge" style={{color: 'var(--accent-orange)'}}>
                      cite:{pub.citations}
                    </span>
                  )}

                  {pub.doi && (
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="om-badge"
                      style={{color: 'var(--text-main)', textDecoration: 'none'}}>
                      doi:↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
