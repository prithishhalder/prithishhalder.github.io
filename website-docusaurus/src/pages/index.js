import React, { useEffect, useState, useRef } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import ThemePaletteSwitcher from '../components/ThemePaletteSwitcher';
import ArticleTicker from '../components/ArticleTicker';
import publicationsData from '../data/publications.json';

function GoesFlareMonitor() {
  const [fluxClass, setFluxClass] = useState('Loading...');
  const [indicatorColor, setIndicatorColor] = useState('var(--accent-green)');
  const canvasRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchGoes() {
      try {
        const res = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json?nocache=' + Date.now());
        const data = await res.json();
        const goesData = data.filter(d => d.energy === '0.1-0.8nm' && d.satellite === 18);
        const series = goesData.map(d => d.flux);

        if (!isMounted || series.length === 0) return;

        const currentFlux = series[series.length - 1];
        let fClass = 'A';
        let color = '#9ece6a'; // Green

        if (currentFlux >= 1e-4) {
          fClass = 'X' + (currentFlux / 1e-4).toFixed(1);
          color = '#f7768e'; // Red
        } else if (currentFlux >= 1e-5) {
          fClass = 'M' + (currentFlux / 1e-5).toFixed(1);
          color = '#e0af68'; // Amber
        } else if (currentFlux >= 1e-6) {
          fClass = 'C' + (currentFlux / 1e-6).toFixed(1);
          color = '#7aa2f7';
        } else if (currentFlux >= 1e-7) {
          fClass = 'B' + (currentFlux / 1e-7).toFixed(1);
        } else {
          fClass = 'A' + (currentFlux / 1e-8).toFixed(1);
        }

        setFluxClass(fClass);
        setIndicatorColor(color);

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const logVals = series.map(f => Math.log10(f));
          const minLog = Math.min(...logVals);
          const maxLog = Math.max(...logVals);
          const range = maxLog === minLog ? 1 : (maxLog - minLog);

          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;

          const step = width / Math.max(1, series.length - 1);
          logVals.forEach((val, idx) => {
            const x = idx * step;
            const y = height - ((val - minLog) / range) * (height - 4) - 2;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      } catch (err) {
        console.warn('GOES SWPC fetch failed:', err);
      }
    }

    fetchGoes();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-line)',
      padding: '4px 12px',
      borderRadius: '4px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem'
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: indicatorColor,
          boxShadow: `0 0 6px ${indicatorColor}`
        }} />
        <span style={{color: 'var(--text-subtle)'}}>[GOES-18]</span>
        <strong style={{color: indicatorColor}}>{fluxClass}</strong>
      </div>
      <canvas ref={canvasRef} width={80} height={18} style={{display: 'block', opacity: 0.9}} />
    </div>
  );
}

export default function Home() {
  const latestPub = publicationsData && publicationsData.length > 0 ? publicationsData[0] : null;

  return (
    <Layout
      title="Dr. Prithish Halder | Astrophysicist"
      description="Astrophysicist & Adjunct Faculty at University of Nebraska-Lincoln. Specialized in cosmic dust modeling, light scattering, and solar flare magnetic topology.">
      
      {/* Top Status & Theme Bar */}
      <div style={{
        borderBottom: '1px solid var(--border-dim)',
        padding: '0.5rem 1.5rem',
        background: 'var(--bg-base)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span style={{color: 'var(--text-subtle)'}}>SYS::STATUS</span>
          <span style={{color: 'var(--accent-green)'}}>● ACTIVE</span>
          <span style={{color: 'var(--text-subtle)'}}>|</span>
          <GoesFlareMonitor />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <span style={{color: 'var(--text-subtle)'}}>THEME:</span>
          <ThemePaletteSwitcher />
        </div>
      </div>

      {/* Hero Terminal Pane (Moved Upward) */}
      <section style={{
        padding: '2rem 1.5rem 1.5rem 1.5rem',
        maxWidth: '1040px',
        margin: '0 auto'
      }}>
        <div style={{
          border: '1px solid var(--border-line)',
          background: 'var(--bg-card)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {/* Terminal Window Header Bar */}
          <div style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-line)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-subtle)'
          }}>
            <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
              <span style={{width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-red)'}} />
              <span style={{width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-yellow)'}} />
              <span style={{width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)'}} />
              <span style={{marginLeft: '8px', color: 'var(--text-muted)'}}>prithish@unl-astrophysics:~$ whoami</span>
            </div>
            <div>[ARCH: LINUX / OMARCHY]</div>
          </div>

          {/* Terminal Content Body */}
          <div style={{padding: '2rem 2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start'}}>
            <img
              src="/profile.jpg"
              alt="Dr. Prithish Halder"
              style={{
                width: '135px',
                height: '135px',
                borderRadius: '4px',
                border: '1px solid var(--border-line)',
                objectFit: 'cover',
                marginTop: '0.25rem'
              }}
            />
            <div style={{flex: '1 1 340px'}}>
              <div style={{fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.82rem', marginBottom: '0.25rem', letterSpacing: '0.05em'}}>
                // ADJUNCT FACULTY • ASTROPHYSICIST
              </div>
              <h1 style={{
                fontSize: '2.3rem', 
                fontWeight: 800, 
                margin: '0 0 0.85rem 0',
                letterSpacing: '-0.03em',
                lineHeight: 1.1
              }}>
                Dr. Prithish Halder
              </h1>

              {/* Affiliation & Appointment Block */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                marginBottom: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem'
              }}>
                <span style={{color: 'var(--accent-blue)', fontWeight: 600}}>📍 AFFILIATION:</span>
                <span style={{color: 'var(--text-main)'}}>
                  Department of Physics & Astronomy, <strong style={{color: 'var(--accent-cyan)'}}>University of Nebraska–Lincoln</strong>
                </span>
              </div>

              {/* Research Focus & Scope Block */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '10px 14px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: '3px solid var(--accent-orange)'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--accent-orange)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  letterSpacing: '0.05em'
                }}>
                  RESEARCH FOCUS
                </div>
                <p style={{
                  color: 'var(--text-muted)', 
                  fontSize: '0.94rem', 
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Specializing in light scattering simulations, morphologically realistic cosmic dust aggregates, and magnetic topology precursor triggers for extreme solar flares.
                </p>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                <Link className="button button--primary" to="/publications">
                  ❯ Publications
                </Link>
                <Link className="button button--secondary" to="/research">
                  ❯ Research Domains
                </Link>
                <a className="button button--secondary" href="pathname:///CV_Prithish_Halder.pdf" target="_blank" rel="noreferrer">
                  📄 CV.pdf
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Recent Highlights Section: Recent Publication & Recent Blog Post */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginTop: '1.5rem'
        }}>
          {/* Box 1: Recent Publication */}
          <div className="card" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{color: 'var(--accent-cyan)', fontWeight: 600}}>
                  [RECENT PUBLICATION]
                </span>
                <span style={{color: 'var(--text-subtle)'}}>
                  {latestPub ? latestPub.year : '2026'}
                </span>
              </div>

              {latestPub && (
                <>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    lineHeight: '1.4',
                    margin: '0 0 0.5rem 0',
                    color: 'var(--text-main)'
                  }}>
                    “{latestPub.title}”
                  </h3>

                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.75rem',
                    lineHeight: '1.5'
                  }}>
                    {latestPub.authors}
                  </p>

                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--text-subtle)',
                    marginBottom: '1rem'
                  }}>
                    <em>{latestPub.journal}</em> — {latestPub.details}
                  </div>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-dim)'
            }}>
              <div style={{display: 'flex', gap: '6px'}}>
                {latestPub && latestPub.qStr && (
                  <span className="om-badge" style={{color: 'var(--accent-blue)'}}>{latestPub.qStr}</span>
                )}
                {latestPub && latestPub.iff > 0 && (
                  <span className="om-badge" style={{color: 'var(--accent-green)'}}>IF: {latestPub.iff}</span>
                )}
              </div>
              <Link to="/publications" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--ifm-color-primary)',
                fontWeight: 600
              }}>
                view all papers →
              </Link>
            </div>
          </div>

          {/* Box 2: Recent Blog Post */}
          <div className="card" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{color: 'var(--accent-orange)', fontWeight: 600}}>
                  [LATEST BLOG POST]
                </span>
                <span style={{color: 'var(--text-subtle)'}}>
                  August 25, 2026
                </span>
              </div>

              <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem'}}>
                <img 
                  src="/images/post2_im1.jpg" 
                  alt="Extreme Solar Flare Prediction" 
                  style={{
                    width: '95px',
                    height: '75px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-line)',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
                <div>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    lineHeight: '1.35',
                    margin: '0 0 0.35rem 0',
                    color: 'var(--text-main)'
                  }}>
                    Predicting Extreme Solar Flares: Magnetic Topology Framework
                  </h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    Presented at ASI 2026. Introducing winding flux & masked PIL diagnostics 3–7 hrs prior to eruptions.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-dim)'
            }}>
              <span className="om-badge" style={{color: 'var(--accent-orange)'}}>featured story</span>
              <Link to="/blog/predicting-extreme-solar-flares" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--accent-orange)',
                fontWeight: 600
              }}>
                read full article →
              </Link>
            </div>
          </div>
        </div>

        {/* Row Below: Running Articles Ticker */}
        <ArticleTicker />
      </section>

      {/* Structured Domain Grids */}
      <main style={{maxWidth: '1040px', margin: '0 auto 4rem auto', padding: '0 1.5rem'}}>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          color: 'var(--text-subtle)'
        }}>
          <span>[RESEARCH DOMAINS]</span>
          <span style={{flex: 1, height: '1px', background: 'var(--border-dim)'}} />
          <span>3 CORE TRACKS</span>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem'}}>
          
          {/* Track 1: Cosmic Dust & Scattering */}
          <div className="card" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.78rem', marginBottom: '0.5rem'}}>
                [01] // ASTROPHYSICS
              </div>
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Cosmic Dust & Scattering</h3>
              <p style={{color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6'}}>
                Realistic aggregate modeling, polarimetry of comets (e.g., 2I/Borisov, C/2023 A3), and computational T-matrix/DDA codes.
              </p>
            </div>
            <div style={{marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)'}}>
              <Link to="/publications?topic=dust" style={{fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600}}>
                grep: "dust" papers (10) →
              </Link>
            </div>
          </div>

          {/* Track 2: Solar Flare & Magnetic Topology */}
          <div className="card" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontSize: '0.78rem', marginBottom: '0.5rem'}}>
                [02] // SPACE WEATHER
              </div>
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Solar Flare Magnetic Topology</h3>
              <p style={{color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6'}}>
                Winding flux vs helicity metrics, Polarity Inversion Line (PIL) masking, and trigger prediction 3–7 hrs prior to X-class flare eruptions.
              </p>
            </div>
            <div style={{marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <Link to="/publications?topic=solar" style={{fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-orange)', fontWeight: 600}}>
                grep: "solar" papers →
              </Link>
              <Link to="/blog/predicting-extreme-solar-flares" style={{fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-subtle)'}}>
                ASI '26 post →
              </Link>
            </div>
          </div>

          {/* Track 3: Nanoscience & Plasmonics */}
          <div className="card" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontSize: '0.78rem', marginBottom: '0.5rem'}}>
                [03] // NANOSCIENCE
              </div>
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Plasmonics & Perovskites</h3>
              <p style={{color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6'}}>
                Electronic entropy, spatial confinement of liquid crystal perovskite nanohybrids, and 1D plasmonic polymer optical modeling.
              </p>
            </div>
            <div style={{marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)'}}>
              <Link to="/publications?topic=plasmonic" style={{fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-purple)', fontWeight: 600}}>
                grep: "plasmonic" papers →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </Layout>
  );
}
