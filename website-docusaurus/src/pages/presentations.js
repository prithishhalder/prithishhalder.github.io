import React from 'react';
import Layout from '@theme/Layout';
import initialTalks from '../data/presentations.json';

export default function Presentations() {
  const talks = initialTalks || [];

  return (
    <Layout
      title="Presentations & Talks"
      description="Conference presentations, keynote addresses, and invited talks by Dr. Prithish Halder">
      <main className="container margin-vert--lg" style={{maxWidth: '900px'}}>
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800}}>Presentations & Talks</h1>
          <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '1.15rem'}}>
            Selected keynote addresses, oral presentations, and conference papers.
          </p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          {talks.map((talk, idx) => (
            <div 
              key={idx}
              className="card shadow--sm"
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--ifm-color-emphasis-200)',
                background: 'var(--ifm-card-background-color)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start'
              }}>
              <span style={{
                background: 'var(--ifm-color-primary)',
                color: '#fff',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                {talk.year}
              </span>
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.2rem', margin: '0 0 0.4rem 0'}}>{talk.title}</h3>
                <div style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '0.95rem', marginBottom: '0.5rem'}}>
                  📍 {talk.venue}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--ifm-color-emphasis-200)',
                  color: 'var(--ifm-color-emphasis-900)'
                }}>
                  {talk.talk_type || talk.type || 'Talk'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}

