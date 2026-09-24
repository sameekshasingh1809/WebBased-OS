(function(){
  'use strict';
  const KEY = 'osSettings';

  /* ---------- state ---------- */
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch{ return {}; } };
  const applyTheme = (t) => { document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light'; };
  const save = (patch) => {
    const next = { ...load(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    parent.postMessage({ type:'os:apply', payload:next }, '*');   // tell the desktop
    applyTheme(next.theme);                                        // and update instantly here
    return next;
  };
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'os:theme') applyTheme(e.data.theme);
  });

  /* ---------- helpers ---------- */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const content = document.getElementById('settingsContent');
  const q = (sel) => content.querySelector(sel);

  function browserName(){
    const ua = navigator.userAgent; let m;
    if ((m = ua.match(/Edg\/(\d+)/)))    return `Microsoft Edge ${m[1]}`;
    if ((m = ua.match(/OPR\/(\d+)/)))    return `Opera ${m[1]}`;
    if ((m = ua.match(/Chrome\/(\d+)/))) return `Google Chrome ${m[1]}`;
    if ((m = ua.match(/Firefox\/(\d+)/)))return `Mozilla Firefox ${m[1]}`;
    if ((m = ua.match(/Version\/(\d+).*Safari/))) return `Safari ${m[1]}`;
    return ua;
  }
  async function readPermission(name){
    try{
      if (!navigator.permissions || !navigator.permissions.query) return 'unsupported';
      return (await navigator.permissions.query({ name })).state;   // granted | denied | prompt
    }catch{ return 'unsupported'; }
  }

  /* ---------- icons ---------- */
  const ICONS = {
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    bt:'<path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>',
    wifi:'<path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>',
    brush:'<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.3 0z"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
  const NAV = [
    ['Account','user'], ['System','monitor'], ['Devices','bt'], ['Network & Internet','wifi'],
    ['Personalization','brush'], ['Privacy & Security','shield'], ['About','info']
  ];

  /* ---------- building blocks ---------- */
  const row = (title, desc, ctl='') =>
    `<div class="item"><div><div>${title}</div>${desc ? `<div class="d">${desc}</div>` : ''}</div><div class="ctl">${ctl}</div></div>`;
  const grp = (...rows) => `<section class="group">${rows.join('')}</section>`;
  const sw  = (id, on, attrs='') => `<label class="switch"><input id="${id}" type="checkbox" ${attrs} ${on ? 'checked' : ''}/><span></span></label>`;
  const rng = (id, min, max, step, v, out) =>
    `<input id="${id}" class="range" type="range" min="${min}" max="${max}" step="${step}" value="${v}"/><output id="${id}Out">${out}</output>`;
  const signal = (level) => `<svg class="sig" viewBox="0 0 16 14" aria-hidden="true">${
    [0,1,2].map(i => `<rect x="${i*6}" y="${9-i*4}" width="4" height="${5+i*4}" rx="1" opacity="${i < level ? 1 : .25}"/>`).join('')}</svg>`;
  const fill = (el) => el.style.setProperty('--pct', ((el.value - el.min) / (el.max - el.min) * 100) + '%');

  /* ---------- wallpapers ---------- */
  const grad = (a, b) => 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='16' height='9' fill='url(#g)'/></svg>`);
  const WALLS = [
    { n:'Default',   u:'' },
    { n:'Mountains', u:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600' },
    { n:'Abstract',  u:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600' },
    { n:'Ocean',     u:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600' },
    { n:'Dusk',      u:grad('#2b1055', '#7597de') },
    { n:'Forest',    u:grad('#134e5e', '#71b280') }
  ];

  /* ---------- pages ---------- */
  const P = {
    Account: (s) => {
      const name = s.username || 'User';
      return `
        <h1>Account</h1>
        <div class="hero">
          <div class="avatar">${esc(Array.from(name)[0].toUpperCase())}</div>
          <div><div class="hero-name">${esc(name)}</div><div class="d">${esc(s.email || 'Local account')}</div></div>
        </div>
        <h2>Your info</h2>
        ${grp(
          row('Display name', 'Shown in the taskbar', `<input id="username" type="text" value="${esc(s.username)}" placeholder="Your name"/>`),
          row('Email', 'Shown in the Start menu', `<input id="email" type="text" value="${esc(s.email)}" placeholder="name@example.com"/>`)
        )}
        <div id="emailError" class="err" role="alert" hidden></div>
        <div class="actions"><button class="btn primary" id="saveUser">Save changes</button><span id="saveStatus" class="d"></span></div>
        <h2>Sign-in options</h2>
        ${grp(row('Require PIN', 'Adds a quicker unlock on top of your password, once the lock screen checks for it.', sw('pinToggle', s.requirePin)))}`;
    },

    System: (s) => {
      const b = s.brightness ?? 1, v = s.volume ?? 70;
      return `
        <h1>System</h1>
        <h2>Display</h2>
        ${grp(row('Brightness', 'Dim or brighten the whole desktop', rng('brightRange', .4, 1.2, .01, b, Math.round(b*100) + '%')))}
        <h2>Sound</h2>
        ${grp(row('Volume', 'Master volume for the system', rng('volRange', 0, 100, 1, v, v + '%')))}
        <h2>Date &amp; time</h2>
        ${grp(row('Clock format', 'How the taskbar shows the time',
          `<select id="clockFmt"><option value="12" ${s.clock24 ? '' : 'selected'}>12-hour</option><option value="24" ${s.clock24 ? 'selected' : ''}>24-hour</option></select>`))}`;
    },

    Devices: (s) => {
      const m = s.mouseSpeed ?? 5;
      return `
        <h1>Devices</h1>
        <h2>Bluetooth</h2>
        ${grp(row('Bluetooth', 'Connect to wireless devices', sw('btToggle', s.bluetooth)))}
        <h2>Mouse</h2>
        ${grp(row('Pointer speed', "Sets how fast the desktop's cursor trail follows you. Browsers can't change the real system pointer speed.", rng('mouseRange', 1, 10, 1, m, m)))}`;
    },

    'Network & Internet': (s) => {
      const online = navigator.onLine;
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const detail = c ? ` · ${c.effectiveType || ''}${c.downlink != null ? ' · ' + c.downlink + ' Mbps' : ''}` : '';
      const nets = s.networks || [
        { ssid:'Campus_WiFi', level:3, secure:true },
        { ssid:'Hotspot_5G',  level:2, secure:true },
        { ssid:'Guest',       level:1, secure:false }
      ];
      const on = s.wifi?.connected ? s.wifi.ssid : null;
      return `
        <h1>Network &amp; Internet</h1>
        ${grp(row('This device', online ? 'Online' + esc(detail) : 'No internet connection detected',
          `<span class="pill ${online ? 'ok' : ''}">${online ? 'Connected' : 'Offline'}</span>`))}
        <h2>Wi-Fi</h2>
        <p class="lead">Browsers can't scan for real nearby networks, so this list is a demo.</p>
        ${grp(...nets.map(n => row(esc(n.ssid), (n.secure ? 'Secured (WPA2)' : 'Open') + (on === n.ssid ? ' · Connected' : ''),
          signal(n.level ?? 2) + (on === n.ssid
            ? `<button class="btn" data-disconnect="${esc(n.ssid)}">Disconnect</button>`
            : `<button class="btn primary" data-connect="${esc(n.ssid)}">Connect</button>`))))}`;
    },

    Personalization: (s) => {
      const theme = s.theme === 'dark' ? 'dark' : 'light', cur = s.wallpaper || '';
      const tile = (t, label) => `<button class="theme-tile" data-theme-pick="${t}" aria-pressed="${theme === t}"><div class="prev ${t}"><i></i><b></b></div><span>${label}</span></button>`;
      return `
        <h1>Personalization</h1>
        <h2>Theme</h2>
        ${grp(`<div class="themes">${tile('light','Light')}${tile('dark','Dark')}</div>`)}
        <h2>Background</h2>
        ${grp(
          `<div class="walls">${WALLS.map(w => `<button class="wall" data-wall="${esc(w.u)}" aria-pressed="${cur === w.u}"><span>${w.n}</span></button>`).join('')}</div>`,
          row('Custom image', 'Paste the address of an image', `<input id="wallUrl" type="url" value="${WALLS.some(w => w.u === cur) ? '' : esc(cur)}" placeholder="https://example.com/wall.jpg"/><button class="btn primary" id="setWall">Set</button>`)
        )}`;
    },

    'Privacy & Security': (s, real = {}, msg = '') => {
      const label = (v) => ({ granted:'Allowed', denied:'Blocked in browser settings', unsupported:'Not supported in this browser', checking:'Checking…' }[v] || 'Not requested yet');
      const perms = [['camera','Camera'], ['mic','Microphone'], ['loc','Location']];
      return `
        <h1>Privacy &amp; Security</h1>
        <p class="lead">These switches show your browser's real permission for this site. Turning one on opens the browser prompt.</p>
        ${msg ? `<div class="notice" role="status">${esc(msg)}</div>` : ''}
        <h2>App permissions</h2>
        ${grp(...perms.map(([k, n]) => row(n, label(real[k]), sw('perm-' + k, real[k] === 'granted', `data-perm="${k}"`))))}`;
    },

    About: (s) => {
      const name = (s.username || 'User') + '’s PC';
      const kv = (k, v) => row(k, '', `<span class="val">${esc(v)}</span>`);
      return `
        <h1>About</h1>
        <div class="hero">
          <div class="avatar pc">${icon('monitor')}</div>
          <div><div class="hero-name">${esc(name)}</div><div class="d">WebOS</div></div>
        </div>
        <h2>Device specifications</h2>
        ${grp(kv('Device name', name), kv('Processor', 'Virtual x64 (demo)'), kv('Installed RAM', '16 GB (demo)'), kv('Screen', `${screen.width} × ${screen.height}`))}
        <h2>WebOS specifications</h2>
        ${grp(kv('Edition', 'WebOS'), kv('Version', 'Build 1.0'), kv('Browser', browserName()), s.email ? kv('Signed in as', s.email) : '')}
        <p class="d" style="margin-top:16px">© ${new Date().getFullYear()} WebOS</p>`;
    }
  };

  /* ---------- behaviour per page ---------- */
  const B = {
    Account(){
      const err = q('#emailError');
      q('#pinToggle').onchange = (e) => save({ requirePin: e.target.checked });
      q('#saveUser').onclick = () => {
        const username = q('#username').value.trim(), email = q('#email').value.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          err.textContent = "That doesn't look like a valid email address. Check it and try again.";
          err.hidden = false; q('#email').focus(); return;
        }
        save({ username, email });
        renderProfile(); render('Account');
        const st = q('#saveStatus'); st.textContent = 'Saved';
        setTimeout(() => { const el = q('#saveStatus'); if (el) el.textContent = ''; }, 1800);
      };
    },
    System(){
      q('#brightRange').oninput = (e) => { const v = +e.target.value; q('#brightRange' + 'Out').textContent = Math.round(v*100) + '%'; save({ brightness:v }); };
      q('#volRange').oninput    = (e) => { const v = +e.target.value; q('#volRangeOut').textContent = v + '%'; save({ volume:v }); };
      q('#clockFmt').onchange   = (e) => save({ clock24: e.target.value === '24' });
    },
    Devices(){
      q('#btToggle').onchange = (e) => save({ bluetooth: e.target.checked });
      q('#mouseRange').oninput = (e) => { const v = +e.target.value; q('#mouseRangeOut').textContent = v; save({ mouseSpeed:v }); };
    },
    'Network & Internet'(){
      content.querySelectorAll('[data-connect]').forEach(b => b.onclick = () => { save({ wifi:{ connected:true, ssid:b.dataset.connect } }); render('Network & Internet'); });
      content.querySelectorAll('[data-disconnect]').forEach(b => b.onclick = () => { save({ wifi:{ connected:false } }); render('Network & Internet'); });
    },
    Personalization(){
      content.querySelectorAll('[data-theme-pick]').forEach(b => b.onclick = () => { save({ theme:b.dataset.themePick }); render('Personalization'); });
      content.querySelectorAll('[data-wall]').forEach(b => {
        const u = b.dataset.wall;
        if (u) b.style.backgroundImage = `url("${u.replace('w=1600', 'w=320')}")`;   // small thumbnails for remote images
        b.onclick = () => { save({ wallpaper:u }); render('Personalization'); };
      });
      q('#setWall').onclick = () => {
        const v = q('#wallUrl').value.trim().replace(/"/g, '%22');
        if (v) { save({ wallpaper:v }); render('Personalization'); }
      };
    }
  };

  /* ---------- privacy (real browser permissions) ---------- */
  const stop = (st) => st.getTracks().forEach(t => t.stop());
  const ASK = {
    camera: () => navigator.mediaDevices.getUserMedia({ video:true }).then(stop),
    mic:    () => navigator.mediaDevices.getUserMedia({ audio:true }).then(stop),
    loc:    () => new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no))
  };
  const HOW = "Open the lock icon in the address bar, choose Permissions for this site, and change it there.";

  async function renderPrivacy(msg = ''){
    const s = load();
    content.innerHTML = P['Privacy & Security'](s, { camera:'checking', mic:'checking', loc:'checking' }, msg);
    const [camera, mic, loc] = await Promise.all([readPermission('camera'), readPermission('microphone'), readPermission('geolocation')]);
    if (current !== 'Privacy & Security') return;   // user navigated away while we waited
    content.innerHTML = P['Privacy & Security'](s, { camera, mic, loc }, msg);
    content.querySelectorAll('[data-perm]').forEach(inp => inp.onchange = async () => {
      let note = '';
      if (inp.checked) { try { await ASK[inp.dataset.perm](); } catch { note = "Access wasn't granted. If it's blocked, " + HOW.charAt(0).toLowerCase() + HOW.slice(1); } }
      else note = "Browsers don't let a page take back a permission it already has. " + HOW;
      renderPrivacy(note);
    });
  }

  /* ---------- shell: profile, nav, render ---------- */
  let current = '';
  function renderProfile(){
    const s = load(), name = s.username || 'User';
    document.getElementById('profile').innerHTML =
      `<div class="avatar">${esc(Array.from(name)[0].toUpperCase())}</div><div><b>${esc(name)}</b><small>${esc(s.email || 'Local account')}</small></div>`;
  }

  function render(name){
    const changed = name !== current;
    current = name;
    document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.section === name ? 'page' : 'false'));
    if (name === 'Privacy & Security') { renderPrivacy(); if (changed) content.scrollTop = 0; return; }
    content.innerHTML = P[name](load());
    content.querySelectorAll('.range').forEach(fill);
    if (B[name]) B[name]();
    if (changed) content.scrollTop = 0;
  }

  content.addEventListener('input', (e) => { if (e.target.classList.contains('range')) fill(e.target); });

  const nav = document.getElementById('nav');
  nav.innerHTML = '<ul>' + NAV.map(([n, i]) =>
    `<li><button data-section="${esc(n)}" title="${esc(n)}">${icon(i)}<span>${esc(n)}</span></button></li>`).join('') + '</ul>';
  nav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) render(b.dataset.section); });

  // Keep the real connection status live while that page is open.
  ['online', 'offline'].forEach(ev => window.addEventListener(ev, () => { if (current === 'Network & Internet') render(current); }));

  applyTheme(load().theme);
  renderProfile();
  render('Account');
})();
