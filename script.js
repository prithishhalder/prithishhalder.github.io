document.addEventListener('DOMContentLoaded', () => {
  // Fallback for link clicks: disables the entire view transition if not home
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      const currentPath = window.location.pathname;
      const targetPath = new URL(this.href).pathname;
      
      const isHome = (path) => path.endsWith('index.html') || path === '/';
      
      const currentIsHome = isHome(currentPath);
      const targetIsHome = isHome(targetPath);
      
      // If we are transitioning between two non-home pages, disable the animation completely
      if (!currentIsHome && !targetIsHome) {
        document.documentElement.style.viewTransitionName = 'none';
      }
    });
  });
});

// Modern View Transitions API control (Chrome 126+)
window.addEventListener("pageswap", (e) => {
  if (e.viewTransition) {
    const currentPath = window.location.pathname;
    const targetPath = new URL(e.activation.entry.url).pathname;
    
    const isHome = (path) => path.endsWith('index.html') || path === '/';
    
    // Skip transition completely if neither page is Home
    if (!isHome(currentPath) && !isHome(targetPath)) {
      e.viewTransition.skipTransition();
    }
  }
});

// Shrink header on scroll for the home page
window.addEventListener('scroll', () => {
  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
  if (!isHome) return;
  
  const header = document.querySelector('header');
  if (header) {
    if (window.scrollY > 50) {
      header.classList.add('small-header');
    } else {
      header.classList.remove('small-header');
    }
  }
});

async function loadTicker() {
  const tickerContents = document.querySelectorAll('.ticker-content');
  if (tickerContents.length === 0) return;

  const cachedData = sessionStorage.getItem('journalTickerData');
  if (cachedData) {
    const { html, duration } = JSON.parse(cachedData);
    tickerContents.forEach(tc => {
      tc.innerHTML = html + html;
      tc.style.animationDuration = `${duration}s`;
    });
    return;
  }

  const feeds = [
    { name: 'Nature Astronomy', url: 'https://www.nature.com/natastron.rss', color: '#e63946' },
    { name: 'AAS Journals (ApJ/AJ)', url: 'https://aasnova.org/feed/', color: '#2a9d8f' },
    { name: 'arXiv (astro-ph)', url: 'http://export.arxiv.org/rss/astro-ph.EP', color: '#B31B1B' }
  ];

  try {
    let allItems = [];
    for (const feed of feeds) {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
      const data = await response.json();
      if (data.status === 'ok') {
        const items = data.items.slice(0, 3).map(item => ({
          title: item.title,
          link: item.link,
          source: feed.name,
          color: feed.color
        }));
        allItems = allItems.concat(items);
      }
    }
    
    if (allItems.length === 0) return;

    // Shuffle array for variety
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    let html = '';
    allItems.forEach(item => {
      html += `<span class="ticker-item"><span class="journal-badge" style="background:${item.color}">${item.source}</span> <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></span>`;
    });

    const duration = allItems.length * 8; // 8 seconds per item

    tickerContents.forEach(tc => {
      tc.innerHTML = html + html;
      tc.style.animationDuration = `${duration}s`;
    });
    
    sessionStorage.setItem('journalTickerData', JSON.stringify({ html, duration }));
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
  }
}

async function drawGoesXray() {
  const canvases = document.querySelectorAll('.goes-xray-chart');
  if (canvases.length === 0) return;

  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json?nocache=' + new Date().getTime());
    const data = await response.json();
    
    // Filter for the primary satellite (e.g. 18) and the correct energy band
    const goesData = data.filter(d => d.energy === '0.1-0.8nm' && d.satellite === 18);
    const series = goesData.map(d => d.flux);
    
    // Create tooltip element if it doesn't exist
    let tooltip = document.getElementById('flare-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'flare-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.background = 'rgba(0, 0, 0, 0.85)';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '8px';
      tooltip.style.fontSize = '12px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      tooltip.style.zIndex = '1000';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
      tooltip.style.border = '1px solid rgba(255,255,255,0.2)';
      document.body.appendChild(tooltip);
    }
    
    function getFlareClass(flux) {
      if (flux >= 1e-4) return 'X' + (flux / 1e-4).toFixed(1);
      if (flux >= 1e-5) return 'M' + (flux / 1e-5).toFixed(1);
      if (flux >= 1e-6) return 'C' + (flux / 1e-6).toFixed(1);
      if (flux >= 1e-7) return 'B' + (flux / 1e-7).toFixed(1);
      return 'A' + (flux / 1e-8).toFixed(1);
    }

    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      // Subtle background to ensure canvas is visible
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      if (series.length === 0) {
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillText("No GOES data", 10, 20);
        return;
      }

      const logVals = series.map(f => Math.log10(f));
      const minDataLog = Math.min(...logVals);
      const maxDataLog = Math.max(...logVals);
      
      // Add slight padding to top and bottom (if all data is the same, provide a default range)
      const range = maxDataLog === minDataLog ? 1 : (maxDataLog - minDataLog);
      const minLog = minDataLog - (range * 0.1);
      const maxLog = maxDataLog + (range * 0.1);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)'; // Solid white for testing
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      const step = width / Math.max(1, (series.length - 1));
      
      logVals.forEach((val, index) => {
        const y = height - ((val - minLog) / (maxLog - minLog)) * height;
        const x = index * step;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Add subtle NOAA attribution watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('NOAA/GOES', 4, 10);

      // Setup Tooltip Interaction
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const scaleX = width / rect.width;
        const actualX = offsetX * scaleX;
        
        let index = Math.round(actualX / step);
        if (index < 0) index = 0;
        if (index >= goesData.length) index = goesData.length - 1;
        
        const point = goesData[index];
        if (point) {
          const fClass = getFlareClass(point.flux);
          const dateStr = new Date(point.time_tag).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
          });
          
          tooltip.innerHTML = `<strong style="color:var(--accent-color); font-size:14px;">${fClass}</strong><br><span style="opacity:0.8">${dateStr}</span>`;
          tooltip.style.display = 'block';
          tooltip.style.left = (e.pageX + 15) + 'px';
          tooltip.style.top = (e.pageY + 15) + 'px';
        }
      });

      canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      // --- Update Flare Class Indicator ---
      const currentFlux = series[series.length - 1];
      let flareClass = getFlareClass(currentFlux);
      let indicatorColor = "#4CAF50"; // Green by default
      let glowColor = "rgba(76, 175, 80, 0.6)";

      if (currentFlux >= 1e-4) {
        indicatorColor = '#ff3333'; // Bright Red
        glowColor = 'rgba(255, 51, 51, 0.8)';
      } else if (currentFlux >= 1e-5) {
        indicatorColor = '#ffaa00'; // Amber/Yellow
        glowColor = 'rgba(255, 170, 0, 0.8)';
      } else if (currentFlux >= 1e-6) {
        indicatorColor = '#4CAF50'; // Green
      }

      const leds = document.querySelectorAll('.led-indicator');
      const texts = document.querySelectorAll('.flare-text');
      
      leds.forEach(led => {
        led.style.backgroundColor = indicatorColor;
        led.style.boxShadow = `inset 0px 2px 2px rgba(255, 255, 255, 0.5), inset 0px -2px 3px rgba(0, 0, 0, 0.3), 0 0 10px ${glowColor}, 0 0 20px ${glowColor}`;
      });

      texts.forEach(txt => {
        txt.textContent = flareClass;
      });
    });
  } catch (error) {
    console.error("Error drawing GOES X-ray:", error);
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fillText("Error loading data", 10, 20);
    });
  }
}

// Fetch RSS on load
document.addEventListener('DOMContentLoaded', () => {
  loadTicker();
  drawGoesXray();
  
  // Fetch and render publications from CSV
  const pubList = document.getElementById('publications-list');
  const pubSort = document.getElementById('pub-sort');
  let publicationsData = [];

  if (pubList) {
    fetch('publications.csv')
      .then(response => response.text())
      .then(data => {
        const rows = data.split('\n').filter(row => row.trim() !== '');
        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Simple CSV parser that respects quotes
          const cols = [];
          let cur = '';
          let inQuote = false;
          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"' && row[j+1] === '"') {
              cur += '"';
              j++; // Skip escaped quote
            } else if (char === '"') {
              inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
              cols.push(cur);
              cur = '';
            } else {
              cur += char;
            }
          }
          cols.push(cur);

          if (cols.length >= 4) {
             const rawAuthors = cols[0];
             
             // Advanced Author Parsing for sorting
             let authorList = rawAuthors.replace(/,\s*and\s+/g, ' and ').split(/,\s*|\s+and\s+/);
             authorList = authorList.map(a => a.trim()).filter(a => a.length > 0);
             const totalAuthors = authorList.length;
             let myPosition = authorList.findIndex(a => a.includes('P. Halder') || a.includes('Prithish Halder'));
             if (myPosition === -1) myPosition = 999;
             
             const isFirstAuthor = (myPosition === 0);
             const authors = rawAuthors.replace('P. Halder', '<strong><u>P. Halder</u></strong>');
             const title = cols[1];
             const journal = cols[2];
             const details = cols[3];
             const iff = cols[4] ? parseFloat(cols[4].trim()) || 0 : 0;
             const sjr = cols[5] ? parseFloat(cols[5].trim()) || 0 : 0;
             const qStr = cols[6] ? cols[6].trim() : '';
             
             let qVal = 99;
             if (qStr === 'Q1') qVal = 1;
             else if (qStr === 'Q2') qVal = 2;
             else if (qStr === 'Q3') qVal = 3;
             else if (qStr === 'Q4') qVal = 4;

             const citations = cols[7] ? parseInt(cols[7].trim(), 10) || 0 : 0;
             const type = cols.length >= 9 ? cols[8].trim() : 'Article';
             
             // Extract year
             let year = 0;
             const yearMatch = details.match(/\b(19|20)\d{2}\b/);
             if (yearMatch) {
                 year = parseInt(yearMatch[0], 10);
             }

             publicationsData.push({
                 authors, isFirstAuthor, myPosition, totalAuthors, title, journal, details,
                 iff, sjr, qStr, qVal, citations, year, type,
                 originalIndex: i
             });
          }
        }
        
        renderPublications(publicationsData);
      })
      .catch(error => console.error("Error loading publications:", error));

      if (pubSort) {
          pubSort.addEventListener('change', (e) => {
              const sortType = e.target.value;
              let sortedData = [...publicationsData];

              if (sortType === 'year-desc') {
                  sortedData.sort((a, b) => b.year - a.year || a.originalIndex - b.originalIndex);
              } else if (sortType === 'author-pos') {
                  sortedData.sort((a, b) => {
                      if (a.myPosition !== b.myPosition) {
                          return a.myPosition - b.myPosition; // Lower index (1st author) first
                      }
                      if (a.totalAuthors !== b.totalAuthors) {
                          return a.totalAuthors - b.totalAuthors; // Fewer total authors first
                      }
                      return a.originalIndex - b.originalIndex;
                  });
              } else if (sortType === 'if-desc') {
                  sortedData.sort((a, b) => b.iff - a.iff || a.originalIndex - b.originalIndex);
              } else if (sortType === 'sjr-desc') {
                  sortedData.sort((a, b) => b.sjr - a.sjr || a.originalIndex - b.originalIndex);
              } else if (sortType === 'q-asc') {
                  sortedData.sort((a, b) => a.qVal - b.qVal || a.originalIndex - b.originalIndex);
              } else if (sortType === 'citations-desc') {
                  sortedData.sort((a, b) => b.citations - a.citations || a.originalIndex - b.originalIndex);
              }

              renderPublications(sortedData);
          });
      }

      const journalMap = {
          "A&A": { full: "Astronomy & Astrophysics", short: "A&A" },
          "ChemPhysChem": { full: "ChemPhysChem", short: "ChemPhysChem" },
          "The Journal of Physical Chemistry C": { full: "The Journal of Physical Chemistry C", short: "J. Phys. Chem. C" },
          "Journal of Materials Chemistry C": { full: "Journal of Materials Chemistry C", short: "J. Mater. Chem. C" },
          "JQSRT": { full: "Journal of Quantitative Spectroscopy and Radiative Transfer", short: "JQSRT" },
          "MNRAS": { full: "Monthly Notices of the Royal Astronomical Society", short: "MNRAS" },
          "ApJ": { full: "The Astrophysical Journal", short: "ApJ" },
          "Icarus": { full: "Icarus", short: "Icarus" },
          "ApJS": { full: "The Astrophysical Journal Supplement Series", short: "ApJS" },
          "Ap&SS": { full: "Astrophysics and Space Science", short: "Ap&SS" },
          "Computer Physics Communications": { full: "Computer Physics Communications", short: "CPC" },
          "IAU General Assembly": { full: "IAU General Assembly", short: "IAU GA" },
          "Journal of Astrophysics and Astronomy": { full: "Journal of Astrophysics and Astronomy", short: "J. Astrophys. Astron." },
          "Astronomical Society of India": { full: "Astronomical Society of India", short: "ASI" }
      };

      function renderPublications(pubs) {
          pubList.innerHTML = '';
          pubs.forEach(pub => {
             const li = document.createElement('li');
             
             // Clean up details to remove dates/months
             let cleanedDetails = pub.details
                 .replace(/\s*\([^)]+\)\s*,?/g, ', ') // removes (Mar. 2026),
                 .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.?\s*(?:\d{1,2}\s*)?,?\s*(19|20)\d{2}\b/gi, '') // removes Aug. 2015
                 .replace(/\s*,\s*,/g, ',')
                 .replace(/\.\s*,/g, ',')
                 .replace(/\s+,/g, ',')
                 .replace(/^,\s*/, '')
                 .trim();

             let fullJournal = pub.journal;
             let shortJournal = pub.journal;
             if (journalMap[pub.journal]) {
                 fullJournal = journalMap[pub.journal].full;
                 shortJournal = journalMap[pub.journal].short;
             }

             let html = `${pub.authors}. “${pub.title}”. `;
             if (fullJournal) html += `<em>${fullJournal}</em> `;
             if (pub.year > 0) html += `<strong>(${pub.year})</strong> `;
             
             html += `${cleanedDetails}`;
             
             if (pub.type === 'Proceeding') {
                html += ` <span style="background:#3F51B5; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:6px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">Proceeding</span>`;
             } else {
                html += ` <span style="background:#009688; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:6px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">Article</span>`;
             }
             
             if (shortJournal) {
                html += ` <span style="background:#E91E63; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">${shortJournal}</span>`;
             }
             
             if (pub.iff > 0) {
                html += ` <span style="background:#4CAF50; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">IF: ${pub.iff}</span>`;
             }
             if (pub.sjr > 0) {
                html += ` <span style="background:#9C27B0; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">SJR: ${pub.sjr}</span>`;
             }
             if (pub.qStr) {
                html += ` <span style="background:#2196F3; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">${pub.qStr}</span>`;
             }
             if (pub.citations > 0) {
                html += ` <span style="background:#D84315; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px; font-weight:bold; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">Citations: ${pub.citations}</span>`;
             }

             li.innerHTML = html;
             pubList.appendChild(li);
          });
      }
      
      // --- Scientific Particle Background ---
      const scienceCanvas = document.getElementById('science-bg');
      if (scienceCanvas) {
          const ctx = scienceCanvas.getContext('2d');
          let width = scienceCanvas.width = window.innerWidth;
          let height = scienceCanvas.height = window.innerHeight;
          
          let particles = [];
          const particleCount = 120;
          
          window.addEventListener('resize', () => {
              width = scienceCanvas.width = window.innerWidth;
              height = scienceCanvas.height = window.innerHeight;
          });

          class Particle {
              constructor() {
                  this.x = Math.random() * width;
                  this.y = Math.random() * height;
                  this.vx = (Math.random() - 0.5) * 0.5;
                  this.vy = (Math.random() - 0.5) * 0.5;
                  this.radius = Math.random() * 1.5 + 0.5;
              }
              update() {
                  this.x += this.vx;
                  this.y += this.vy;
                  if (this.x < 0 || this.x > width) this.vx *= -1;
                  if (this.y < 0 || this.y > height) this.vy *= -1;
              }
              draw() {
                  ctx.beginPath();
                  ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
                  ctx.fill();
              }
          }

          for (let i = 0; i < particleCount; i++) {
              particles.push(new Particle());
          }

          function animateBg() {
              ctx.clearRect(0, 0, width, height);
              
              for (let i = 0; i < particleCount; i++) {
                  particles[i].update();
                  particles[i].draw();
                  
                  for (let j = i; j < particleCount; j++) {
                      const dx = particles[i].x - particles[j].x;
                      const dy = particles[i].y - particles[j].y;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      
                      if (dist < 100) {
                          ctx.beginPath();
                          ctx.strokeStyle = `rgba(100, 200, 255, ${0.15 - dist/660})`;
                          ctx.lineWidth = 0.5;
                          ctx.moveTo(particles[i].x, particles[i].y);
                          ctx.lineTo(particles[j].x, particles[j].y);
                          ctx.stroke();
                      }
                  }
              }
              requestAnimationFrame(animateBg);
          }
          animateBg();
      }
  }
});