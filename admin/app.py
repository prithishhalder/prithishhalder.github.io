#!/usr/bin/env python3
"""
Academic Portfolio GUI Admin Portal for Dr. Prithish Halder
Self-contained, zero-dependency Python HTTP server with SHA-256 session auth.
Allows adding, editing, and updating Publications, Presentations, and Blog posts with direct SQLite sync.
"""

import http.server
import socketserver
import urllib.parse
import sqlite3
import hashlib
import secrets
import json
import os
import re
from datetime import datetime

PORT = 5050
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
DB_PATH = os.path.join(PROJECT_ROOT, 'database', 'publications.db')
BLOG_DIR = os.path.join(PROJECT_ROOT, 'website-docusaurus', 'blog')

SESSIONS = set()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def verify_credentials(username, password):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT password_hash, salt FROM admin_users WHERE username = ?', (username,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return False
    saved_hash = row['password_hash']
    salt = row['salt']
    computed_hash = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return secrets.compare_digest(saved_hash, computed_hash)

def trigger_sync():
    os.system(f"python3 {os.path.join(PROJECT_ROOT, 'database', 'manage_db.py')} sync")

HTML_LOGIN = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Login // Dr. Prithish Halder</title>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Geist:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { --bg: #1a1b26; --card: #1f2335; --border: #414868; --accent: #7aa2f7; --text: #c0caf5; --red: #f7768e; }
  * { box-sizing: border-box; }
  body { margin:0; background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
  .login-box { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .prompt { font-family: 'Fira Code', monospace; color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem; }
  h1 { margin: 0 0 1.5rem 0; font-size: 1.5rem; }
  label { display: block; font-family: 'Fira Code', monospace; font-size: 0.8rem; margin-bottom: 0.4rem; color: #a9b1d6; }
  input { width: 100%; background: #16161e; border: 1px solid var(--border); border-radius: 4px; padding: 0.6rem 0.8rem; color: #fff; font-family: inherit; font-size: 0.9rem; margin-bottom: 1.25rem; outline: none; }
  input:focus { border-color: var(--accent); }
  button { width: 100%; background: var(--accent); color: #1a1b26; font-family: 'Fira Code', monospace; font-weight: 700; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; }
  button:hover { opacity: 0.9; }
  .error { color: var(--red); font-family: 'Fira Code', monospace; font-size: 0.8rem; margin-bottom: 1rem; }
</style>
</head>
<body>
<div class="login-box">
  <div class="prompt">prithish@portal:~$ sudo login</div>
  <h1>Academic Admin</h1>
  {{ERROR}}
  <form method="POST" action="/login">
    <label>USERNAME</label>
    <input type="text" name="username" required autofocus placeholder="e.g. prithish">
    <label>PASSWORD</label>
    <input type="password" name="password" required placeholder="••••••••••••">
    <button type="submit">❯ AUTHENTICATE</button>
  </form>
</div>
</body>
</html>"""

HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Academic CMS Dashboard // Dr. Prithish Halder</title>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #1a1b26; --surface: #24283b; --card: #1f2335; --border: #414868;
    --text: #c0caf5; --muted: #a9b1d6; --subtle: #565f89; --accent: #7aa2f7;
    --green: #9ece6a; --orange: #ff9e64; --cyan: #7dcfff; --red: #f7768e;
  }
  * { box-sizing: border-box; }
  body { margin:0; background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; display: flex; min-height: 100vh; }
  
  /* Sidebar */
  aside { width: 250px; background: #16161e; border-right: 1px solid var(--border); display: flex; flex-direction: column; }
  .brand { padding: 1.5rem; border-bottom: 1px solid var(--border); font-family: 'Fira Code', monospace; font-size: 0.85rem; color: var(--cyan); }
  nav { flex: 1; padding: 1rem 0; }
  nav a { display: flex; align-items: center; gap: 10px; padding: 0.75rem 1.5rem; color: var(--muted); text-decoration: none; font-family: 'Fira Code', monospace; font-size: 0.85rem; border-left: 3px solid transparent; }
  nav a:hover, nav a.active { color: var(--text); background: var(--surface); border-left-color: var(--accent); }
  .logout { padding: 1.5rem; border-top: 1px solid var(--border); }
  .logout a { color: var(--red); text-decoration: none; font-family: 'Fira Code', monospace; font-size: 0.85rem; }

  /* Main Container */
  main { flex: 1; padding: 2rem 3rem; overflow-y: auto; max-width: 1200px; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 2rem; }
  h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
  .status-pill { font-family: 'Fira Code', monospace; font-size: 0.75rem; background: var(--surface); border: 1px solid var(--border); padding: 4px 10px; border-radius: 4px; color: var(--green); }
  
  /* Form Elements */
  .tab-pane { display: none; }
  .tab-pane.active { display: block; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 1.75rem; margin-bottom: 2rem; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; }
  .form-group { margin-bottom: 1.25rem; }
  label { display: block; font-family: 'Fira Code', monospace; font-size: 0.75rem; color: var(--cyan); margin-bottom: 0.4rem; }
  input, select, textarea { width: 100%; background: #16161e; border: 1px solid var(--border); border-radius: 4px; padding: 0.6rem 0.8rem; color: #fff; font-family: inherit; font-size: 0.9rem; outline: none; }
  input:focus, textarea:focus { border-color: var(--accent); }
  textarea { min-height: 120px; font-family: 'Fira Code', monospace; font-size: 0.85rem; resize: vertical; }
  button { background: var(--accent); color: #1a1b26; font-family: 'Fira Code', monospace; font-weight: 700; border: none; padding: 0.7rem 1.5rem; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; }
  button:hover { opacity: 0.9; }
  .btn-edit { background: var(--surface); color: var(--cyan); border: 1px solid var(--border); padding: 4px 8px; font-size: 0.75rem; cursor: pointer; border-radius: 3px; }
  .btn-edit:hover { border-color: var(--cyan); }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
  th { font-family: 'Fira Code', monospace; font-size: 0.75rem; color: var(--subtle); text-transform: uppercase; }
  .chip { font-family: 'Fira Code', monospace; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px; border: 1px solid currentColor; }

  /* Modal */
  .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 1000; align-items: center; justify-content: center; }
  .modal-overlay.active { display: flex; }
  .modal-content { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 2rem; width: 90%; max-width: 750px; max-height: 90vh; overflow-y: auto; }
</style>
<script>
  function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('nav-' + tabId).classList.add('active');
    window.location.hash = tabId;
  }
  
  function openEditModal(pubData) {
    document.getElementById('edit-id').value = pubData.id;
    document.getElementById('edit-title').value = pubData.title;
    document.getElementById('edit-authors').value = pubData.authors;
    document.getElementById('edit-journal').value = pubData.journal;
    document.getElementById('edit-journal-name-preview').textContent = pubData.journal || 'same journal';
    document.getElementById('edit-year').value = pubData.year;
    document.getElementById('edit-pub_type').value = pubData.pub_type;
    document.getElementById('edit-iff').value = pubData.impact_factor;
    document.getElementById('edit-sjr').value = pubData.sjr;
    document.getElementById('edit-quartile').value = pubData.quartile;
    document.getElementById('edit-citations').value = pubData.citations;
    document.getElementById('edit-details').value = pubData.details;
    document.getElementById('edit-doi').value = pubData.doi;
    document.getElementById('edit-modal').classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
  }

  window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.replace('#', '') || 'publications';
    if (document.getElementById(hash)) showTab(hash);
  });
</script>
</head>
<body>

<aside>
  <div class="brand">
    <div>// ACADEMIC PORTAL</div>
    <div style="color:var(--text); font-weight:700; margin-top:4px;">Dr. Prithish Halder</div>
  </div>
  <nav>
    <a href="#publications" id="nav-publications" onclick="showTab('publications')">📄 Publications</a>
    <a href="#presentations" id="nav-presentations" onclick="showTab('presentations')">🎤 Presentations</a>
    <a href="#blog" id="nav-blog" onclick="showTab('blog')">✍️ Blog Composer</a>
    <a href="#deploy" id="nav-deploy" onclick="showTab('deploy')">🚀 Sync & Deploy</a>
  </nav>
  <div class="logout">
    <a href="/logout">❯ LOGOUT</a>
  </div>
</aside>

<main>
  <!-- TAB 1: PUBLICATIONS -->
  <div id="publications" class="tab-pane active">
    <header>
      <div>
        <h1>Publications Database</h1>
        <div style="color:var(--muted); font-size:0.9rem; margin-top:4px;">Add new publications or edit existing metrics (IF, SJR, Quartile, Citations).</div>
      </div>
      <div class="status-pill">SQLITE CONNECTED</div>
    </header>

    <div class="card">
      <h3 style="margin-top:0; color:var(--cyan); font-family:'Fira Code', monospace; font-size:1rem;">+ ADD NEW PUBLICATION</h3>
      <form method="POST" action="/api/add-publication">
        <div class="form-group">
          <label>TITLE *</label>
          <input type="text" name="title" required placeholder="e.g. Prediction of extreme solar flares...">
        </div>
        <div class="form-group">
          <label>AUTHORS STRING * (Separate by commas)</label>
          <input type="text" name="authors" required placeholder="e.g. P. Halder, S. K. Mishra, A. K. Srivastava">
        </div>
        <div class="grid-3">
          <div class="form-group">
            <label>JOURNAL / CONFERENCE *</label>
            <input type="text" name="journal" required placeholder="e.g. ApJ, A&A, MNRAS">
          </div>
          <div class="form-group">
            <label>YEAR *</label>
            <input type="number" name="year" required value="2026">
          </div>
          <div class="form-group">
            <label>PUBLICATION TYPE</label>
            <select name="pub_type">
              <option value="Article">Article</option>
              <option value="Proceeding">Proceeding</option>
            </select>
          </div>
        </div>
        <div class="grid-4">
          <div class="form-group">
            <label>IMPACT FACTOR (IF)</label>
            <input type="number" step="0.1" name="iff" value="0.0">
          </div>
          <div class="form-group">
            <label>SJR SCORE</label>
            <input type="number" step="0.1" name="sjr" value="0.0">
          </div>
          <div class="form-group">
            <label>QUARTILE (Q1/Q2/Q3/Q4)</label>
            <input type="text" name="quartile" placeholder="Q1">
          </div>
          <div class="form-group">
            <label>CITATIONS</label>
            <input type="number" name="citations" value="0">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>DETAILS (VOL, ISSUE, PAGES)</label>
            <input type="text" name="details" placeholder="e.g. 707, A150 (Mar. 2026)">
          </div>
          <div class="form-group">
            <label>DOI (OPTIONAL)</label>
            <input type="text" name="doi" placeholder="e.g. 10.1051/0004-6361/202555905">
          </div>
        </div>
        <button type="submit">💾 SAVE NEW PUBLICATION & SYNC</button>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-top:0; font-family:'Fira Code', monospace; font-size:1rem;">DATABASE RECORDS ({{PUB_COUNT}} TOTAL)</h3>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Title</th>
            <th>Journal</th>
            <th>IF</th>
            <th>SJR</th>
            <th>Q</th>
            <th>Cites</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {{PUB_ROWS}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB 2: PRESENTATIONS -->
  <div id="presentations" class="tab-pane">
    <header>
      <div>
        <h1>Conference Talks & Keynotes</h1>
        <div style="color:var(--muted); font-size:0.9rem; margin-top:4px;">Manage talks, workshops, and invited sessions.</div>
      </div>
    </header>

    <div class="card">
      <h3 style="margin-top:0; color:var(--cyan); font-family:'Fira Code', monospace; font-size:1rem;">+ ADD NEW PRESENTATION</h3>
      <form method="POST" action="/api/add-presentation">
        <div class="form-group">
          <label>TALK / POSTER TITLE *</label>
          <input type="text" name="title" required placeholder="e.g. Keynote: Machine Learning in Astronomy">
        </div>
        <div class="grid-3">
          <div class="form-group">
            <label>YEAR *</label>
            <input type="text" name="year" required value="2026">
          </div>
          <div class="form-group">
            <label>CONFERENCE / VENUE *</label>
            <input type="text" name="venue" required placeholder="e.g. ASI 2026, IIT Guwahati">
          </div>
          <div class="form-group">
            <label>TYPE / AWARD</label>
            <select name="talk_type">
              <option value="Oral / Contributed">Oral / Contributed</option>
              <option value="Keynote">Keynote</option>
              <option value="Invited Talk">Invited Talk</option>
              <option value="Best Poster Award">Best Poster Award</option>
              <option value="Poster">Poster</option>
            </select>
          </div>
        </div>
        <button type="submit">💾 SAVE PRESENTATION</button>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-top:0; font-family:'Fira Code', monospace; font-size:1rem;">RECORDED PRESENTATIONS</h3>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Title</th>
            <th>Venue</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {{PRES_ROWS}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB 3: BLOG COMPOSER -->
  <div id="blog" class="tab-pane">
    <header>
      <div>
        <h1>Blog Composer</h1>
        <div style="color:var(--muted); font-size:0.9rem; margin-top:4px;">Write Markdown posts directly with frontmatter and publish to Docusaurus.</div>
      </div>
    </header>

    <div class="card">
      <h3 style="margin-top:0; color:var(--cyan); font-family:'Fira Code', monospace; font-size:1rem;">✍️ NEW POST</h3>
      <form method="POST" action="/api/add-blog">
        <div class="grid-2">
          <div class="form-group">
            <label>POST TITLE *</label>
            <input type="text" name="title" required placeholder="e.g. Observing Magnetic Loops with SDO">
          </div>
          <div class="form-group">
            <label>SLUG / FILENAME *</label>
            <input type="text" name="slug" required placeholder="e.g. observing-magnetic-loops">
          </div>
        </div>
        <div class="form-group">
          <label>TAGS (COMMA SEPARATED)</label>
          <input type="text" name="tags" placeholder="e.g. solar-physics, space-weather, python">
        </div>
        <div class="form-group">
          <label>MARKDOWN CONTENT *</label>
          <textarea name="content" rows="14" placeholder="Write your post in Markdown here...&#10;&#10;<!-- truncate -->&#10;&#10;Detailed content..."></textarea>
        </div>
        <button type="submit">🚀 PUBLISH BLOG POST</button>
      </form>
    </div>
  </div>

  <!-- TAB 4: DEPLOY & SYNC -->
  <div id="deploy" class="tab-pane">
    <header>
      <div>
        <h1>Sync & GitHub Deployment</h1>
        <div style="color:var(--muted); font-size:0.9rem; margin-top:4px;">Re-bundle static files or trigger an instant synchronization.</div>
      </div>
    </header>
    <div class="card">
      <h3 style="margin-top:0; color:var(--green); font-family:'Fira Code', monospace;">MANUAL DATABASE SYNC</h3>
      <p style="color:var(--muted); font-size:0.9rem;">Runs `python3 database/manage_db.py sync` to regenerate `publications.json`, `presentations.json`, and `publications.bib`.</p>
      <form method="POST" action="/api/sync-now">
        <button type="submit">⚡ SYNC DATABASE NOW</button>
      </form>
    </div>
  </div>
</main>

<!-- EDIT PUBLICATION MODAL -->
<div id="edit-modal" class="modal-overlay">
  <div class="modal-content">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:1rem; margin-bottom:1.5rem;">
      <h2 style="margin:0; font-size:1.3rem; color:var(--cyan); font-family:'Fira Code', monospace;">✏️ EDIT PUBLICATION & METRICS</h2>
      <button onclick="closeEditModal()" type="button" style="background:transparent; color:var(--muted); border:none; font-size:1.4rem; cursor:pointer;">&times;</button>
    </div>
    
    <form method="POST" action="/api/update-publication">
      <input type="hidden" name="id" id="edit-id">
      <div class="form-group">
        <label>TITLE *</label>
        <input type="text" name="title" id="edit-title" required>
      </div>
      <div class="form-group">
        <label>AUTHORS STRING *</label>
        <input type="text" name="authors" id="edit-authors" required>
      </div>
      <div class="grid-3">
        <div class="form-group">
          <label>JOURNAL *</label>
          <input type="text" name="journal" id="edit-journal" required>
        </div>
        <div class="form-group">
          <label>YEAR *</label>
          <input type="number" name="year" id="edit-year" required>
        </div>
        <div class="form-group">
          <label>PUBLICATION TYPE</label>
          <select name="pub_type" id="edit-pub_type">
            <option value="Article">Article</option>
            <option value="Proceeding">Proceeding</option>
          </select>
        </div>
      </div>
      <div class="grid-4">
        <div class="form-group">
          <label>IMPACT FACTOR (IF)</label>
          <input type="number" step="0.1" name="iff" id="edit-iff">
        </div>
        <div class="form-group">
          <label>SJR SCORE</label>
          <input type="number" step="0.1" name="sjr" id="edit-sjr">
        </div>
        <div class="form-group">
          <label>QUARTILE (Q1/Q2/Q3/Q4)</label>
          <input type="text" name="quartile" id="edit-quartile">
        </div>
        <div class="form-group">
          <label>CITATIONS</label>
          <input type="number" name="citations" id="edit-citations">
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>DETAILS (VOL, ISSUE, PAGES)</label>
          <input type="text" name="details" id="edit-details">
        </div>
        <div class="form-group">
          <label>DOI</label>
          <input type="text" name="doi" id="edit-doi">
        </div>
      </div>

      <div style="background:var(--surface); border:1px solid var(--border); border-radius:4px; padding:10px 14px; margin-top:0.5rem; display:flex; align-items:center; gap:10px;">
        <input type="checkbox" name="update_all_journal" id="edit-update_all_journal" value="1" checked style="width:18px; height:18px; margin:0; cursor:pointer;">
        <label for="edit-update_all_journal" style="margin:0; cursor:pointer; color:var(--text); font-family:'Geist', sans-serif; font-size:0.85rem;">
          ⚡ <strong>Smart Journal Sync:</strong> Also update IF, SJR, and Quartile for <em>all other publications</em> in this same journal (<span id="edit-journal-name-preview" style="color:var(--cyan); font-family:'Fira Code', monospace;"></span>).
        </label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem;">
        <button type="button" onclick="closeEditModal()" style="background:var(--surface); color:var(--text);">Cancel</button>
        <button type="submit">💾 SAVE CHANGES & SYNC</button>
      </div>
    </form>
  </div>
</div>

</body>
</html>"""

class AdminHandler(http.server.BaseHTTPRequestHandler):
    def get_cookie_session(self):
        cookie = self.headers.get('Cookie', '')
        for c in cookie.split(';'):
            if '=' in c:
                k, v = c.strip().split('=', 1)
                if k == 'admin_session' and v in SESSIONS:
                    return v
        return None

    def send_redirect(self, location, set_cookie=None):
        self.send_response(303)
        self.send_header('Location', location)
        if set_cookie:
            self.send_header('Set-Cookie', set_cookie)
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path

        if path == '/login':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(HTML_LOGIN.replace('{{ERROR}}', '').encode('utf-8'))
            return

        if path == '/logout':
            sess = self.get_cookie_session()
            if sess and sess in SESSIONS:
                SESSIONS.remove(sess)
            self.send_redirect('/login', set_cookie='admin_session=; Path=/; Max-Age=0')
            return

        # Check Auth for all other routes
        session = self.get_cookie_session()
        if not session:
            self.send_redirect('/login')
            return

        if path in ['/', '/admin', '/index.html']:
            conn = get_db()
            cur = conn.cursor()
            
            # Pub rows
            cur.execute('SELECT id, year, title, authors, journal, details, impact_factor, sjr, quartile, citations, pub_type, doi FROM publications ORDER BY year DESC, id DESC')
            pubs = cur.fetchall()
            pub_rows_html = ""
            for p in pubs:
                p_dict = dict(p)
                p_json = json.dumps(p_dict).replace('"', '&quot;').replace("'", "&#39;")
                q_chip = f"<span class='chip' style='color:var(--orange)'>{p['quartile']}</span>" if p['quartile'] else "-"
                if_val = p['impact_factor'] if p['impact_factor'] else "-"
                sjr_val = p['sjr'] if p['sjr'] else "-"
                cite_val = p['citations'] if p['citations'] else "0"

                pub_rows_html += f"""<tr>
                  <td>{p['year']}</td>
                  <td><strong>{p['title'][:48]}...</strong></td>
                  <td>{p['journal']}</td>
                  <td>{if_val}</td>
                  <td>{sjr_val}</td>
                  <td>{q_chip}</td>
                  <td>{cite_val}</td>
                  <td>
                    <button type="button" class="btn-edit" onclick="openEditModal({p_json})">✏️ Edit</button>
                  </td>
                </tr>"""

            # Pres rows
            cur.execute('SELECT year, title, venue, talk_type FROM presentations ORDER BY year DESC, id DESC')
            talks = cur.fetchall()
            pres_rows_html = ""
            for t in talks:
                pres_rows_html += f"<tr><td>{t['year']}</td><td>{t['title']}</td><td>{t['venue']}</td><td><span class='chip' style='color:var(--green)'>{t['talk_type']}</span></td></tr>"

            conn.close()

            html = HTML_DASHBOARD.replace('{{PUB_ROWS}}', pub_rows_html)
            html = html.replace('{{PRES_ROWS}}', pres_rows_html)
            html = html.replace('{{PUB_COUNT}}', str(len(pubs)))

            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
            return

        self.send_error(404, "Page Not Found")

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_len).decode('utf-8')
        params = urllib.parse.parse_qs(post_data)

        if self.path == '/login':
            username = params.get('username', [''])[0].strip()
            password = params.get('password', [''])[0].strip()

            if verify_credentials(username, password):
                sess_id = secrets.token_hex(24)
                SESSIONS.add(sess_id)
                self.send_redirect('/admin', set_cookie=f'admin_session={sess_id}; Path=/; HttpOnly')
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                err = "<div class='error'>⚠ Invalid credentials. Access denied.</div>"
                self.wfile.write(HTML_LOGIN.replace('{{ERROR}}', err).encode('utf-8'))
            return

        # Check Auth for API Actions
        if not self.get_cookie_session():
            self.send_redirect('/login')
            return

        if self.path == '/api/add-publication':
            title = params.get('title', [''])[0].strip()
            authors = params.get('authors', [''])[0].strip()
            journal = params.get('journal', [''])[0].strip()
            year = int(params.get('year', ['2026'])[0].strip())
            pub_type = params.get('pub_type', ['Article'])[0].strip()
            iff = float(params.get('iff', ['0.0'])[0].strip() or 0.0)
            sjr = float(params.get('sjr', ['0.0'])[0].strip() or 0.0)
            quartile = params.get('quartile', [''])[0].strip()
            citations = int(params.get('citations', ['0'])[0].strip() or 0)
            details = params.get('details', [''])[0].strip()
            doi = params.get('doi', [''])[0].strip()

            first_author = authors.split(',')[0].replace('P. ', '').replace(' ', '')
            title_word = re.sub(r'[^a-zA-Z]', '', title.split()[0] if title.split() else 'Pub')
            cite_key = f"{first_author}{year}{title_word}_{secrets.token_hex(2)}"

            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
            INSERT INTO publications (cite_key, title, authors, journal, year, details, impact_factor, sjr, quartile, citations, pub_type, doi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (cite_key, title, authors, journal, year, details, iff, sjr, quartile, citations, pub_type, doi))
            conn.commit()
            conn.close()

            trigger_sync()
            self.send_redirect('/admin#publications')
            return

        if self.path == '/api/update-publication':
            pub_id = int(params.get('id', ['0'])[0].strip())
            title = params.get('title', [''])[0].strip()
            authors = params.get('authors', [''])[0].strip()
            journal = params.get('journal', [''])[0].strip()
            year = int(params.get('year', ['2026'])[0].strip())
            pub_type = params.get('pub_type', ['Article'])[0].strip()
            iff = float(params.get('iff', ['0.0'])[0].strip() or 0.0)
            sjr = float(params.get('sjr', ['0.0'])[0].strip() or 0.0)
            quartile = params.get('quartile', [''])[0].strip()
            citations = int(params.get('citations', ['0'])[0].strip() or 0)
            details = params.get('details', [''])[0].strip()
            doi = params.get('doi', [''])[0].strip()
            update_all_journal = params.get('update_all_journal', ['0'])[0].strip() == '1'

            conn = get_db()
            cur = conn.cursor()
            
            # Update specific publication
            cur.execute('''
            UPDATE publications 
            SET title = ?, authors = ?, journal = ?, year = ?, details = ?, impact_factor = ?, sjr = ?, quartile = ?, citations = ?, pub_type = ?, doi = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            ''', (title, authors, journal, year, details, iff, sjr, quartile, citations, pub_type, doi, pub_id))
            
            # Smart cascade update: propagate IF, SJR, Quartile to all publications with the same journal name
            if update_all_journal and journal:
                cur.execute('''
                UPDATE publications
                SET impact_factor = ?, sjr = ?, quartile = ?, updated_at = CURRENT_TIMESTAMP
                WHERE LOWER(TRIM(journal)) = LOWER(TRIM(?))
                ''', (iff, sjr, quartile, journal))

            conn.commit()
            conn.close()

            trigger_sync()
            self.send_redirect('/admin#publications')
            return

        if self.path == '/api/add-presentation':
            title = params.get('title', [''])[0].strip()
            year = params.get('year', ['2026'])[0].strip()
            venue = params.get('venue', [''])[0].strip()
            talk_type = params.get('talk_type', ['Oral / Contributed'])[0].strip()

            conn = get_db()
            cur = conn.cursor()
            cur.execute('INSERT INTO presentations (year, title, venue, talk_type) VALUES (?, ?, ?, ?)', (year, title, venue, talk_type))
            conn.commit()
            conn.close()

            trigger_sync()
            self.send_redirect('/admin#presentations')
            return

        if self.path == '/api/add-blog':
            title = params.get('title', [''])[0].strip()
            slug = params.get('slug', [''])[0].strip()
            tags_str = params.get('tags', [''])[0].strip()
            content = params.get('content', [''])[0]

            today = datetime.now().strftime('%Y-%m-%d')
            filename = f"{today}-{slug}.md"
            tags_list = [f"'{t.strip()}'" for t in tags_str.split(',') if t.strip()]
            tags_formatted = f"[{', '.join(tags_list)}]" if tags_list else "[]"

            md_content = f"""---
slug: {slug}
title: "{title}"
authors: [prithish]
date: {today}
tags: {tags_formatted}
---

{content}
"""
            os.makedirs(BLOG_DIR, exist_ok=True)
            with open(os.path.join(BLOG_DIR, filename), 'w', encoding='utf-8') as f:
                f.write(md_content)

            self.send_redirect('/admin#blog')
            return

        if self.path == '/api/sync-now':
            trigger_sync()
            self.send_redirect('/admin#deploy')
            return

        self.send_error(404, "Not Found")

def run():
    with socketserver.TCPServer(("", PORT), AdminHandler) as httpd:
        print(f"==================================================")
        print(f"🔒 Dr. Prithish Halder Academic CMS Portal Running")
        print(f"👉 Local URL: http://localhost:{PORT}/admin")
        print(f"👉 Default user: prithish | password: adminpassword123")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down admin server.")

if __name__ == '__main__':
    run()
