/* ===  ZLT Password Generator — Real Algorithms  === */
/* Operator password: derived from IMEI char codes using seed-based generation */
/* User password: derived from formatted MAC address char codes */
/* Test password: derived from IMEI digits 7-14 with accumulator */

// ======== CORE ALGORITHMS (exact same as the working tool) ========

const AMBIGUOUS = '1ILil';

function alphabetChar(m) {
  return m < 10 ? 48 + m : m < 36 ? 55 + m : 61 + m;
}

function generateFrom(data, opts = {}) {
  const filterAmbiguous = opts.filterAmbiguous !== false;
  const numericOnly = opts.numericOnly || false;
  const len = data.length;
  if (!len) return '';
  const out = new Array(8);
  for (let i = 0; i < 8; i++) {
    let seed = 1;
    for (let j = 0; j < len; j++) {
      while (seed > 0xffffff) seed = ~seed & 0xffffff;
      const idx = (i + j) % len;
      const product = ((i + 1) * (j + 1)) & 0xff;
      seed = seed + data[idx] * product;
    }
    while (seed > 0xffffff) seed = ~seed & 0xffffff;
    let ch;
    if (numericOnly) {
      ch = 48 + (seed % 10);
    } else {
      ch = alphabetChar(seed % 52);
      if (filterAmbiguous && AMBIGUOUS.includes(String.fromCharCode(ch))) ch += 1;
    }
    out[i] = ch;
  }
  return String.fromCharCode(...out);
}

function formatMacBytes(mac) {
  const filtered = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  const pairs = [];
  for (let i = 0; i < filtered.length; i += 2) pairs.push(filtered.slice(i, i + 2));
  const formatted = pairs.join(':');
  const bytes = new Array(formatted.length);
  for (let i = 0; i < formatted.length; i++) bytes[i] = formatted.charCodeAt(i);
  return { bytes, formatted };
}

// OPERATOR PASSWORD — from IMEI
function operatorPass(imei) {
  const c = String(imei || '').replace(/\s+/g, '');
  if (c.length < 15) return null;
  const data = new Array(c.length);
  for (let i = 0; i < c.length; i++) data[i] = c.charCodeAt(i);
  return generateFrom(data, { filterAmbiguous: true, numericOnly: false });
}

// USER PASSWORD — from MAC
function userPass(mac) {
  const { bytes } = formatMacBytes(mac || '');
  if (!bytes.length) return null;
  return generateFrom(bytes, { filterAmbiguous: true, numericOnly: false });
}

// TEST PASSWORD — from IMEI
function testPassword(imei) {
  const c = String(imei || '').replace(/\s+/g, '');
  if (c.length < 15) return null;
  for (let i = 0; i < c.length; i++) {
    const cc = c.charCodeAt(i);
    if (cc < 48 || cc > 57) return null;
  }
  const r = c.slice(7, 15);
  let acc = 0;
  const out = new Array(8);
  for (let i = 0; i < 8; i++) {
    acc = i + acc + (r.charCodeAt(i) - 48);
    out[i] = 48 + (acc % 10);
  }
  return String.fromCharCode(...out);
}

// ======== UI LOGIC ========

function onImeiInput(el) {
  el.value = el.value.replace(/\D/g, '').slice(0, 15);
  const len = el.value.length;
  document.getElementById('imeiCount').textContent = len + '/15 digits';
  const status = document.getElementById('imeiStatus');
  if (len === 15) {
    status.textContent = '✓ Valid';
    status.className = 'valid';
  } else if (len > 0) {
    status.textContent = 'Need 15 digits';
    status.className = 'invalid';
  } else {
    status.textContent = '';
    status.className = '';
  }
  updateSubmitBtn();
}

function onMacInput(el) {
  const hex = el.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 12);
  el.value = (hex.match(/.{1,2}/g) || []).join(':');
  const len = hex.length;
  document.getElementById('macCount').textContent = len + '/12 hex';
  const status = document.getElementById('macStatus');
  if (len === 12) {
    status.textContent = '✓ Valid';
    status.className = 'valid';
  } else if (len > 0) {
    status.textContent = 'Need 12 hex chars';
    status.className = 'invalid';
  } else {
    status.textContent = '';
    status.className = '';
  }
  updateSubmitBtn();
}

function updateSubmitBtn() {
  const imei = document.getElementById('imeiInput').value.replace(/\D/g, '');
  const mac = document.getElementById('macInput').value.replace(/[^0-9A-Fa-f]/g, '');
  document.getElementById('submitBtn').disabled = !(imei.length === 15 || mac.length === 12);
}

function handleSubmit(e) {
  e.preventDefault();
  const imeiRaw = document.getElementById('imeiInput').value.replace(/\D/g, '');
  const macRaw = document.getElementById('macInput').value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  const imeiValid = imeiRaw.length === 15;
  const macValid = macRaw.length === 12;

  if (!imeiValid && !macValid) {
    showError('Enter a 15-digit IMEI or a 12-character MAC address.');
    return false;
  }

  hideError();
  const warnings = [];

  // Generate passwords
  let op = null, us = null, te = null;
  if (imeiValid) {
    op = operatorPass(imeiRaw);
    te = testPassword(imeiRaw);
  } else {
    warnings.push('IMEI not provided — skipping Operator and Test passwords.');
  }
  if (macValid) {
    us = userPass(macRaw);
  } else {
    warnings.push('MAC not provided — skipping User password.');
  }

  // Display
  document.getElementById('operatorVal').textContent = op || '—';
  document.getElementById('userVal').textContent = us || '—';
  document.getElementById('testVal').textContent = te || '—';

  document.getElementById('operatorCard').classList.toggle('has-value', !!op);
  document.getElementById('userCard').classList.toggle('has-value', !!us);
  document.getElementById('testCard').classList.toggle('has-value', !!te);

  // Warnings
  const warnEl = document.getElementById('warnings');
  if (warnings.length) {
    warnEl.style.display = 'block';
    warnEl.innerHTML = '<strong>⚠️ Notes:</strong> ' + warnings.map(w => '<span>' + w + '</span>').join(' ');
  } else {
    warnEl.style.display = 'none';
  }

  document.getElementById('resultsSection').style.display = 'block';
  document.getElementById('placeholderSection').style.display = 'none';
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  return false;
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
}
function hideError() {
  document.getElementById('errorMsg').style.display = 'none';
}

function copyVal(id) {
  const text = document.getElementById(id).textContent;
  if (!text || text === '—') return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => flashCopy(id));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); flashCopy(id); } catch {}
    document.body.removeChild(ta);
  }
}

function flashCopy(id) {
  const btn = document.getElementById(id === 'operatorVal' ? 'copyOp' : id === 'userVal' ? 'copyUs' : 'copyTe');
  btn.textContent = '✅ Copied!';
  setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
}
