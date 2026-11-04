import React from 'react';
import Layout from '@theme/Layout';

export default function Contact() {
  return (
    <Layout
      title="Contact Me"
      description="Get in touch with Dr. Prithish Halder">
      <main className="container margin-vert--lg" style={{maxWidth: '800px'}}>
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800}}>Contact Me</h1>
          <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '1.15rem'}}>
            Feel free to reach out for collaborations, academic inquiries, or student advising.
          </p>
        </div>

        <div className="card shadow--md" style={{
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-card-background-color)'
        }}>
          <h2 style={{marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem'}}>Office & Academic Affiliation</h2>
          <p style={{lineHeight: '1.7', fontSize: '1.05rem'}}>
            <strong>Dr. Prithish Halder</strong><br />
            Adjunct Faculty, Department of Physics & Astronomy<br />
            University of Nebraska-Lincoln<br />
            Lincoln, NE, United States
          </p>

          <hr style={{margin: '1.5rem 0', opacity: 0.2}} />

          <h2 style={{marginBottom: '1rem', fontSize: '1.4rem'}}>Direct Links</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1.05rem'}}>
            <div>
              📧 <strong>Email:</strong> <a href="mailto:prithishh3@gmail.com">prithishh3@gmail.com</a>
            </div>
            <div>
              🔗 <strong>Google Scholar:</strong> <a href="https://scholar.google.com/citations?user=6hXcCtgAAAAJ" target="_blank" rel="noopener noreferrer">Scholar Profile</a>
            </div>
            <div>
              🔗 <strong>ORCID:</strong> <a href="https://orcid.org/0000-0002-1073-1419" target="_blank" rel="noopener noreferrer">0000-0002-1073-1419</a>
            </div>
            <div>
              🔗 <strong>ResearchGate:</strong> <a href="https://www.researchgate.net/profile/Prithish_Halder/scores" target="_blank" rel="noopener noreferrer">ResearchGate Profile</a>
            </div>
            <div>
              🔗 <strong>GitHub:</strong> <a href="https://github.com/prithishhalder" target="_blank" rel="noopener noreferrer">github.com/prithishhalder</a>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

