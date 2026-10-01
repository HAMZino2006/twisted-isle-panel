const pages = {
  '/dashboard': ['Dashboard', 'Overview of your Twisted Isle server'],
  '/server': ['Server', 'Live server status and connection details'],
  '/players': ['Players', 'Players currently connected to the server'],
  '/logs': ['Logs', 'Recent panel activity'],
  '/commands': ['Commands', 'Execute an authorised server command'],
  '/rcon': ['RCON', 'Remote console connection status'],
  '/config': ['Config', 'Panel configuration'],
  '/discord': ['Discord', 'Discord authentication and access']
};
let currentUser;
let serverStatus;

const $ = (selector) => document.querySelector(selector);
async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `Request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}
function renderView() {
  const route = pages[window.location.pathname] ? window.location.pathname : '/dashboard';
  const [title, subtitle] = pages[route];
  $('#page-title').textContent = title; $('#page-subtitle').textContent = subtitle;
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.route === route));
  const status = serverStatus || { online: false, players: 0, maxPlayers: 0, provider: 'unknown' };
  const common = `<div class="grid"><div class="stat-box"><div class="stat-label">Players</div><div class="stat-value">${status.players}</div><div class="stat-unit">/ ${status.maxPlayers || '?'} online</div></div><div class="stat-box"><div class="stat-label">Server</div><div class="stat-value">${status.online ? 'Online' : 'Offline'}</div><div class="stat-unit">${status.provider}</div></div><div class="stat-box"><div class="stat-label">Version</div><div class="stat-value">${status.version}</div><div class="stat-unit">The Isle Evrima</div></div></div>`;
  const content = { '/dashboard': `${common}<section class="card"><div class="card-title">Welcome, ${currentUser.username}</div><p>Use the navigation buttons to open each panel section.</p></section>`, '/server': `${common}<section class="card"><div class="card-title">Server details</div><p>Connection provider: ${status.provider}</p>${status.error ? `<p class="text-warning">${status.error}</p>` : ''}</section>`, '/players': `${common}<section class="card"><div class="card-title">Players online</div><p>The exact count is read from the configured RCON status command.</p></section>`, '/logs': '<section class="card"><div class="card-title">Activity logs</div><p>No activity has been recorded in this panel yet.</p></section>', '/commands': '<section class="card"><div class="card-title">Server command</div><form id="command-form"><input id="command-input" placeholder="Enter an RCON command" maxlength="200" required /><button class="btn primary" type="submit">Send command</button></form><pre id="command-result"></pre></section>', '/rcon': `<section class="card"><div class="card-title">RCON status</div><p>${status.online ? 'RCON connection is available.' : 'RCON connection is unavailable.'}</p>${status.error ? `<p class="text-warning">${status.error}</p>` : ''}</section>`, '/config': '<section class="card"><div class="card-title">Configuration</div><p>Configuration is managed through Render environment variables.</p></section>', '/discord': `<section class="card"><div class="card-title">Discord access</div><p>Signed in as ${currentUser.username} with role ${currentUser.role}.</p></section>` }[route];
  $('#view').innerHTML = content;
  $('#command-form')?.addEventListener('submit', async (event) => { event.preventDefault(); $('#command-result').textContent = 'Sending...'; try { const result = await api('/api/server/command', { method: 'POST', body: JSON.stringify({ command: $('#command-input').value }) }); $('#command-result').textContent = result.message; } catch (error) { $('#command-result').textContent = error.message; } });
}
async function load() {
  try {
    currentUser = await api('/api/me');
    $('#user-name').textContent = currentUser.username; $('#user-role').textContent = currentUser.role; $('#user-avatar').src = currentUser.avatar ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    $('#app').hidden = false; $('#login').hidden = true;
    try { serverStatus = await api('/api/server'); } catch (error) { serverStatus = { online: false, players: 0, maxPlayers: 0, version: 'Evrima', provider: 'RCON', error: error.message }; }
    renderView();
  } catch { $('#app').hidden = true; $('#login').hidden = false; }
}
document.addEventListener('click', (event) => { const link = event.target.closest('a[data-route]'); if (!link) return; event.preventDefault(); history.pushState({}, '', link.dataset.route); renderView(); });
window.addEventListener('popstate', renderView);
$('#logout')?.addEventListener('click', async () => { await api('/auth/logout', { method: 'POST' }); location.href = '/'; });
load();
