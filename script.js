document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('modeToggle');
  const body = document.body;

  // Load saved mode
  if (localStorage.getItem('mode') === 'dark') {
    body.classList.add('dark');
    toggle.checked = true;
  }

  toggle.addEventListener('change', () => {
    body.classList.toggle('dark');
    localStorage.setItem('mode', body.classList.contains('dark') ? 'dark' : 'light');
  });
});