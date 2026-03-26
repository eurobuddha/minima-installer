/* ============================================================
   MINIMA INSTALLER — Wizard Logic
   Handles preflight, form, SSE install stream, view transitions
   ============================================================ */

(function () {
  'use strict';

  // ---- State ----
  let currentView = 'preflight';
  let preflightData = null;

  // ---- DOM refs ----
  const views = {
    preflight: document.getElementById('view-preflight'),
    config: document.getElementById('view-config'),
    progress: document.getElementById('view-progress')
  };
  const steps = document.querySelectorAll('.step');
  const btnContinue = document.getElementById('btn-continue');
  const btnBackConfig = document.getElementById('btn-back-config');
  const btnAdvanced = document.getElementById('btn-advanced');
  const advancedSection = document.getElementById('advanced-section');
  const configForm = document.getElementById('config-form');
  const btnGenerate = document.getElementById('btn-generate');
  const btnTogglePass = document.getElementById('btn-toggle-pass');
  const rpcEnableToggle = document.getElementById('rpcEnable');
  const rpcPasswordGroup = document.getElementById('rpc-password-group');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const logArea = document.getElementById('log-area');

  // ---- View transitions ----
  function showView(name) {
    Object.keys(views).forEach(k => views[k].classList.remove('active'));
    views[name].classList.add('active');

    const stepMap = { preflight: 1, config: 2, progress: 3 };
    const activeStep = stepMap[name];
    steps.forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.remove('active', 'done');
      if (n === activeStep) s.classList.add('active');
      else if (n < activeStep) s.classList.add('done');
    });

    currentView = name;
  }

  // ---- Preflight ----
  async function runPreflight() {
    try {
      const res = await fetch('/api/preflight');
      preflightData = await res.json();
      renderPreflight(preflightData);
    } catch (err) {
      renderPreflightError(err.message);
    }
  }

  function renderPreflight(data) {
    updateCheck('check-java', data.java);
    updateCheck('check-tmux', data.tmux);

    if (data.ready) {
      btnContinue.disabled = false;
    } else {
      const hints = [];
      if (data.java.hint) hints.push(data.java.hint);
      if (data.tmux.hint) hints.push(data.tmux.hint);
      if (hints.length) {
        const hintBox = document.getElementById('preflight-hint');
        hintBox.innerHTML = hints.map(h => {
          // Wrap command-like text in code tags
          return `<p>${h.replace(/(brew install \w+)/g, '<code>$1</code>')}</p>`;
        }).join('');
        hintBox.style.display = 'block';
      }
    }
  }

  function updateCheck(id, info) {
    const el = document.getElementById(id);
    const icon = el.querySelector('.check-icon');
    const badge = el.querySelector('.check-badge');
    const detail = el.querySelector('.check-detail');

    icon.classList.remove('loading');

    if (info.available) {
      el.classList.add('pass');
      icon.classList.add('ok');
      icon.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>';
      badge.textContent = info.version ? `v${info.version}` : 'Found';
      badge.classList.add('found');
      if (info.path) detail.textContent = info.path;
    } else {
      el.classList.add('fail');
      icon.classList.add('err');
      icon.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>';
      badge.textContent = 'Not found';
      badge.classList.add('missing');
    }
  }

  function renderPreflightError(msg) {
    const hintBox = document.getElementById('preflight-hint');
    hintBox.innerHTML = `<p>Could not check system requirements: ${msg}</p>`;
    hintBox.style.display = 'block';
  }

  // ---- Password generation ----
  function generatePassword(length = 12) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, v => chars[v % chars.length]).join('');
  }

  // ---- Collect form data ----
  function getConfig() {
    return {
      port: document.getElementById('port').value,
      mdsPassword: document.getElementById('mdsPassword').value,
      dataFolder: document.getElementById('dataFolder').value,
      mdsEnable: document.getElementById('mdsEnable').checked,
      rpcEnable: document.getElementById('rpcEnable').checked,
      rpcPassword: document.getElementById('rpcPassword').value,
      desktopMode: document.getElementById('desktopMode').checked,
      autoStart: document.getElementById('autoStart').checked,
      noP2P: document.getElementById('noP2P').checked,
      connectNode: document.getElementById('connectNode').value,
      dbPassword: document.getElementById('dbPassword').value,
      archiveMode: document.getElementById('archiveMode').checked,
      megaMMR: document.getElementById('megaMMR').checked
    };
  }

  // ---- Install via SSE ----
  function startInstall(config) {
    showView('progress');

    // Reset progress UI
    progressBar.style.width = '0%';
    progressPercent.textContent = '';
    logArea.innerHTML = '';
    document.getElementById('installing-state').style.display = 'block';
    document.getElementById('success-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';

    // POST with SSE response
    fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                handleEvent(event);
              } catch (e) { /* ignore parse errors */ }
            }
          });

          read();
        });
      }

      read();
    }).catch(err => {
      showError(err.message);
    });
  }

  function handleEvent(event) {
    switch (event.type) {
      case 'status':
        addLog(event.data);
        break;
      case 'progress': {
        const p = JSON.parse(event.data);
        progressBar.style.width = p.percent + '%';
        progressPercent.textContent = `${p.downloaded} MB / ${p.total} MB (${p.percent}%)`;
        break;
      }
      case 'complete':
        showSuccess(JSON.parse(event.data));
        break;
      case 'error':
        showError(event.data);
        break;
    }
  }

  function addLog(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = msg;
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
  }

  function showSuccess(info) {
    progressBar.style.width = '100%';
    document.getElementById('installing-state').style.display = 'none';
    document.getElementById('success-state').style.display = 'block';

    const mdsUrl = `https://localhost:${info.mdsPort}`;
    const mdsLink = document.getElementById('mds-link');
    mdsLink.href = mdsUrl;
    mdsLink.textContent = mdsUrl;

    document.getElementById('control-cmd').textContent = info.controlPanel;
    document.getElementById('java-cmd').textContent = info.javaCmd;
  }

  function showError(msg) {
    document.getElementById('installing-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-message').textContent = msg;
  }

  // ---- Event listeners ----

  // Continue from preflight
  btnContinue.addEventListener('click', () => showView('config'));

  // Back from config
  btnBackConfig.addEventListener('click', () => showView('preflight'));

  // Advanced toggle
  btnAdvanced.addEventListener('click', () => {
    const open = advancedSection.style.display !== 'none';
    advancedSection.style.display = open ? 'none' : 'block';
    btnAdvanced.querySelector('.chevron').classList.toggle('open', !open);
  });

  // Generate password
  btnGenerate.addEventListener('click', () => {
    const input = document.getElementById('mdsPassword');
    input.value = generatePassword();
    input.type = 'text';
    // Auto-hide after 3s
    setTimeout(() => { input.type = 'password'; }, 3000);
  });

  // Toggle password visibility
  btnTogglePass.addEventListener('click', () => {
    const input = document.getElementById('mdsPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Show/hide RPC password when RPC toggled
  rpcEnableToggle.addEventListener('change', () => {
    rpcPasswordGroup.style.display = rpcEnableToggle.checked ? 'block' : 'none';
  });

  // Form submit
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const mdsPass = document.getElementById('mdsPassword').value;
    if (!mdsPass) {
      document.getElementById('mdsPassword').focus();
      return;
    }

    const config = getConfig();
    startInstall(config);
  });

  // Retry
  document.getElementById('btn-retry').addEventListener('click', () => {
    showView('config');
  });

  // ---- Init ----
  runPreflight();

})();
