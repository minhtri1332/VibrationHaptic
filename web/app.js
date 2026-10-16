/* ============================================================
   VibrationHaptic — Web App Logic
   Firebase Realtime Database · Send signals only (no receive)
   ============================================================ */

// ---- Firebase init ----

firebase.initializeApp({
  apiKey: 'AIzaSyC_KtJpQkJtga4xUJZN47wogYMJ9RS6eLo',
  databaseURL:
    'https://vibrationhaptic-af479-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'vibrationhaptic-af479',
});

const db = firebase.database();

// ---- DOM refs ----

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screenHome = $('#screen-home');
const screenDevices = $('#screen-devices');
const screenSend = $('#screen-send');
const screenManage = $('#screen-manage');
const deviceList = $('#device-list');
const manageList = $('#manage-list');
const sendHeader = $('#send-header');
const sendStatus = $('#send-status');
const toastEl = $('#toast');

// ---- Navigation ----

const screens = [screenHome, screenDevices, screenSend, screenManage];
let history = [];

function showScreen(el) {
  screens.forEach((s) => s.classList.remove('active'));
  el.classList.add('active');
  // Re-trigger animation
  el.style.animation = 'none';
  // eslint-disable-next-line no-void
  void el.offsetHeight;
  el.style.animation = '';
}

function navigate(screen) {
  history.push(screen);
  showScreen(screen);
}

function goBack() {
  history.pop();
  const prev = history[history.length - 1] || screenHome;
  showScreen(prev);
}

// Home → Devices
$('#card-send').addEventListener('click', () => navigate(screenDevices));

// Home → Manage
$('#btn-manage').addEventListener('click', () => navigate(screenManage));

// Back buttons
$$('[data-back]').forEach((btn) =>
  btn.addEventListener('click', goBack),
);

// Start on home
history = [screenHome];

// ---- Toast ----

let toastTimeout;
function showToast(msg) {
  clearTimeout(toastTimeout);
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  // Force reflow for re-triggering animation
  void toastEl.offsetHeight;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 300);
  }, 2500);
}

// ---- Confirm dialog ----

function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-card">
        <p class="confirm-title">${title}</p>
        <p class="confirm-msg">${message}</p>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn-cancel">Huỷ</button>
          <button class="confirm-btn confirm-btn-danger">Xoá</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.confirm-btn-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    overlay.querySelector('.confirm-btn-danger').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
  });
}

// ---- Firebase: Devices ----

/** @type {{ id: string; name: string }[]} */
let devices = [];
let devicesLoaded = false;
let devicesError = null;

db.ref('devices').on(
  'value',
  (snapshot) => {
    const val = snapshot.val() || {};
    devices = Object.entries(val)
      .filter(([, d]) => d && typeof d.name === 'string')
      .map(([id, d]) => ({ id, name: d.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    devicesLoaded = true;
    devicesError = null;
    renderDeviceList();
    renderManageList();
  },
  (err) => {
    devicesError = err.message;
    devicesLoaded = true;
    renderDeviceList();
    renderManageList();
  },
);

// ---- Render: Device list (for sending) ----

function renderDeviceList() {
  if (!devicesLoaded) {
    deviceList.innerHTML = '<div class="spinner"></div>';
    return;
  }
  if (devicesError) {
    deviceList.innerHTML = `<p class="state-msg error">${esc(devicesError)}</p>`;
    return;
  }
  if (devices.length === 0) {
    deviceList.innerHTML =
      '<p class="state-msg">Chưa có thiết bị. Bấm + ở màn hình chính để tạo.</p>';
    return;
  }
  deviceList.innerHTML = devices
    .map(
      (d) => `
    <button class="feature-card" data-device-id="${esc(d.id)}">
      <div class="card-accent" style="background:var(--send)"></div>
      <div class="card-body">
        <span class="card-title">${esc(d.name)}</span>
        <span class="card-desc">${esc(d.id)}</span>
      </div>
      <span class="card-chevron">›</span>
    </button>
  `,
    )
    .join('');

  // Click → go to send screen
  deviceList.querySelectorAll('[data-device-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deviceId;
      const dev = devices.find((d) => d.id === id);
      if (dev) openSendScreen(dev);
    });
  });
}

// ---- Render: Manage list ----

function renderManageList() {
  if (!devicesLoaded) {
    manageList.innerHTML = '<div class="spinner"></div>';
    return;
  }
  if (devicesError) {
    manageList.innerHTML = `<p class="state-msg error">${esc(devicesError)}</p>`;
    return;
  }
  if (devices.length === 0) {
    manageList.innerHTML = '<p class="state-msg">Chưa có thiết bị nào.</p>';
    return;
  }
  manageList.innerHTML = devices
    .map(
      (d) => `
    <div class="device-row">
      <div class="device-row-body">
        <div class="device-row-name">${esc(d.name)}</div>
        <div class="device-row-id">${esc(d.id)}</div>
      </div>
      <button class="device-delete-btn" data-delete-id="${esc(d.id)}" data-delete-name="${esc(d.name)}">Xoá</button>
    </div>
  `,
    )
    .join('');

  manageList.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteId;
      const name = btn.dataset.deleteName;
      const confirmed = await showConfirm(
        'Xoá thiết bị',
        `Xoá "${name}" khỏi danh sách?`,
      );
      if (!confirmed) return;
      try {
        await Promise.all([
          db.ref(`devices/${id}`).remove(),
          db.ref(`signals/${id}`).remove(),
        ]);
        showToast(`Đã xoá "${name}"`);
      } catch (e) {
        showToast('Xoá thất bại: ' + e.message);
      }
    });
  });
}

// ---- Send screen ----

/** @type {{ id: string; name: string } | null} */
let currentDevice = null;

function openSendScreen(device) {
  currentDevice = device;
  sendHeader.textContent = 'Gửi tới: ' + device.name;
  sendStatus.textContent = 'Chọn tín hiệu để gửi';
  sendStatus.className = 'send-status';
  navigate(screenSend);
}

$$('.signal-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!currentDevice) return;
    const letter = btn.dataset.letter;
    const pulses = { A: 1, B: 2, C: 3, D: 4 }[letter];

    // Visual feedback
    btn.classList.add('sending');
    setTimeout(() => btn.classList.remove('sending'), 600);

    sendStatus.textContent = `Đang gửi ${letter}…`;
    sendStatus.className = 'send-status';

    try {
      await db.ref(`signals/${currentDevice.id}`).set({
        letter,
        at: firebase.database.ServerValue.TIMESTAMP,
      });
      sendStatus.textContent = `Đã gửi ${letter} ✓`;
      sendStatus.className = 'send-status success';
    } catch (e) {
      console.warn('sendSignal error:', e);
      sendStatus.textContent = `Gửi ${letter} thất bại`;
      sendStatus.className = 'send-status error';
    }
  });
});

// ---- Helpers ----

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Keyboard nav: Escape to go back ----

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && history.length > 1) {
    goBack();
  }
});
