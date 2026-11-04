import React from 'react';
import Layout from '@theme/Layout';

export default function Gallery() {
  const images = [
    {
      title: 'Solar Flare Prediction Model (NOAA AR 13664 & AR 13842)',
      src: '/images/post2_im1.jpg',
      caption: 'Winding flux and magnetic topology precursor analysis presented at ASI 2026.'
    },
    {
      title: 'Academic Banner & Solar Corona Visualization',
      src: '/banner.jpg',
      caption: 'Solar coronal magnetic loop configurations.'
    }
  ];

  return (
    <Layout
      title="Scientific Gallery"
      description="Visualizations, astronomical charts, and presentation moments">
      <main className="container margin-vert--lg" style={{maxWidth: '1000px'}}>
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800}}>Scientific Gallery</h1>
          <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '1.15rem'}}>
            Astrophysical visualizations, simulation outputs, and research media.
          </p>
        </div>

        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem'
        }}>
          {images.map((item, idx) => (
            <div 
              key={idx}
              className="card shadow--md"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--ifm-color-emphasis-200)',
                background: 'var(--ifm-card-background-color)'
              }}>
              <div style={{height: '240px', overflow: 'hidden', background: '#000'}}>
                <img 
                  src={item.src} 
                  alt={item.title} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              </div>
              <div style={{padding: '1.25rem'}}>
                <h3 style={{fontSize: '1.15rem', marginBottom: '0.4rem'}}>{item.title}</h3>
                <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '0.9rem', margin: 0}}>
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}

