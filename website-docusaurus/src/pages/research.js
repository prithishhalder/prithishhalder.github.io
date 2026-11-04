import React from 'react';
import Layout from '@theme/Layout';

export default function Research() {
  return (
    <Layout
      title="Research & Expertise"
      description="Research interests and technical expertise of Dr. Prithish Halder">
      <main className="container margin-vert--lg" style={{maxWidth: '900px'}}>
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800}}>Research & Expertise</h1>
          <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '1.15rem'}}>
            Investigating cosmic dust modeling, light scattering theory, and magnetic topology of active solar regions.
          </p>
        </div>

        <div className="card shadow--md margin-bottom--lg" style={{borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-card-background-color)', padding: '1.5rem'}}>
          <h2 style={{color: '#60a5fa', marginBottom: '1rem'}}>Research Interests</h2>
          <ul style={{lineHeight: '1.8', fontSize: '1.05rem'}}>
            <li>
              <strong>Dust in Astrophysics:</strong> Comet dust (morphology and composition), Asteroid dust, Interplanetary dust, Proto-planetary dust, Interstellar dust/medium, Circum-galactic dust/medium.
            </li>
            <li>
              <strong>Light Scattering Processes:</strong> Polarization, Scattering, Absorption, Extinction.
            </li>
            <li>
              <strong>Solar Physics:</strong> Solar energetic particles (SEP), Solar flares (Magnetic topology), Flare Prediction, Stellar flares & CMEs.
            </li>
            <li>
              <strong>Atmospheric Science & Nanoscience:</strong> Aerosols, Air-borne micro-plastics, Plasmonics, Nano crystals, Perovskite.
            </li>
          </ul>
        </div>

        <div className="card shadow--md margin-bottom--lg" style={{borderRadius: '12px', border: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-card-background-color)', padding: '1.5rem'}}>
          <h2 style={{color: '#34d399', marginBottom: '1rem'}}>Skills & Technical Stack</h2>
          <ul style={{lineHeight: '1.8', fontSize: '1.05rem'}}>
            <li>
              <strong>Programming Languages:</strong> Julia, Fortran, C/C++, Python, R, Bash, Java, Visual Basic, MatLab, LaTeX.
            </li>
            <li>
              <strong>Light Scattering Tools:</strong> Mie theory, T-matrix, DDA (Discrete Dipole Approximation), RGD.
            </li>
            <li>
              <strong>Data Reduction & Topology:</strong> IRAF, PyRAF, DS9, DAVE4VM, ARTop, NLFFF, GPU Computing (CUDA.jl).
            </li>
            <li>
              <strong>Machine Learning:</strong> XGBoost, CNN, Siamese Neural Networks, Random Forest.
            </li>
            <li>
              <strong>Graphics & Scientific Visualization:</strong> Gnuplot, Matplotlib, Origin, VTK, ParaView, Blender 3D.
            </li>
          </ul>
        </div>
      </main>
    </Layout>
  );
}

