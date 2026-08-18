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
    // The data array might contain both satellite 16 and 18 if they are both reporting
    const series = data.filter(d => d.energy === '0.1-0.8nm' && d.satellite === 18).map(d => d.flux);
    
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

      // --- Update Flare Class Indicator ---
      const currentFlux = series[series.length - 1];
      let flareClass = "A";
      let indicatorColor = "#4CAF50"; // Green by default
      let glowColor = "rgba(76, 175, 80, 0.6)";

      if (currentFlux >= 1e-4) {
        flareClass = 'X' + (currentFlux / 1e-4).toFixed(1);
        indicatorColor = '#ff3333'; // Bright Red
        glowColor = 'rgba(255, 51, 51, 0.8)';
      } else if (currentFlux >= 1e-5) {
        flareClass = 'M' + (currentFlux / 1e-5).toFixed(1);
        indicatorColor = '#ffaa00'; // Amber/Yellow
        glowColor = 'rgba(255, 170, 0, 0.8)';
      } else if (currentFlux >= 1e-6) {
        flareClass = 'C' + (currentFlux / 1e-6).toFixed(1);
        indicatorColor = '#4CAF50'; // Green
      } else if (currentFlux >= 1e-7) {
        flareClass = 'B' + (currentFlux / 1e-7).toFixed(1);
      } else {
        flareClass = 'A' + (currentFlux / 1e-8).toFixed(1);
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
});