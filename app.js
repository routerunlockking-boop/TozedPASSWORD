/* ===  ZLT Password Generator — Real Algorithms  === */
/* Operator password: derived from IMEI char codes using seed-based generation */
/* User password: derived from formatted MAC address char codes */
/* Test password: derived from IMEI digits 7-14 with accumulator */

// ======== CORE ALGORITHMS (exact same as the working tool) ========

const AMBIGUOUS = '1ILil';

function alphabetChar(m) {
  if (m < 10) return 48 + m; // 0-9
  if (m < 36) return 55 + m; // A-Z
  return 61 + m; // a-z
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
      const mod = opts.mod || 52;
      ch = alphabetChar(seed % mod);
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
  return generateFrom(data, { filterAmbiguous: true, numericOnly: false, mod: 52 });
}

// S50 NEW VERSION OPERATOR — from IMEI (62 chars)
function operatorPassNew(imei) {
  const c = String(imei || '').replace(/\s+/g, '');
  if (c.length < 15) return null;
  const data = new Array(c.length);
  for (let i = 0; i < c.length; i++) data[i] = c.charCodeAt(i);
  return generateFrom(data, { filterAmbiguous: false, numericOnly: false, mod: 62 });
}

// USER PASSWORD — from MAC
function userPass(mac) {
  const { bytes } = formatMacBytes(mac || '');
  if (!bytes.length) return null;
  return generateFrom(bytes, { filterAmbiguous: true, numericOnly: false, mod: 52 });
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
  let op = null, opNew = null, us = null, te = null;
  if (imeiValid) {
    op = operatorPass(imeiRaw);
    opNew = operatorPassNew(imeiRaw);
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
  document.getElementById('operatorVal').innerHTML = op ? `<div>${op} <small>(v1)</small></div>` : '—';
  if (opNew) {
    document.getElementById('operatorVal').innerHTML += `<div style="margin-top:4px">${opNew} <small>(S50 New)</small></div>`;
  }
  
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

// ======== OCR LOGIC (Scan Sticker) ========

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');
    const ocrLoader = document.getElementById('ocrLoader');
    const ocrProgress = document.getElementById('ocrProgress');

    if (!fileInput || !uploadZone) return;

    // Handle File Selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            processImage(e.target.files[0]);
        }
    });

    // Drag and Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processImage(e.dataTransfer.files[0]);
        }
    });

    async function processImage(file) {
        ocrLoader.style.display = 'flex';
        ocrProgress.textContent = '0%';

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        ocrProgress.textContent = Math.round(m.progress * 100) + '%';
                    }
                }
            });

            const text = result.data.text;
            console.log('OCR Output:', text);

            // Regex for IMEI (15 digits)
            const imeiMatch = text.match(/\b\d{15}\b/);
            // Regex for MAC (XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX)
            const macMatch = text.match(/\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/) || text.match(/\b[0-9A-Fa-f]{12}\b/);

            let found = false;
            if (imeiMatch) {
                const imeiInput = document.getElementById('imeiInput');
                imeiInput.value = imeiMatch[0];
                onImeiInput(imeiInput);
                found = true;
            }

            if (macMatch) {
                const macInput = document.getElementById('macInput');
                macInput.value = macMatch[0].replace(/[:-]/g, '');
                onMacInput(macInput);
                found = true;
            }

            if (found) {
                // Auto-submit if we found anything
                document.getElementById('genForm').dispatchEvent(new Event('submit'));
            } else {
                alert('Could not find IMEI or MAC in this photo. Please try a clearer picture or enter manually.');
            }

        } catch (err) {
            console.error('OCR Error:', err);
            alert('Error processing image. Please try again.');
        } finally {
            ocrLoader.style.display = 'none';
            fileInput.value = ''; // Reset input
        }
    }
});

function copyVal(id) {
  let text = document.getElementById(id).textContent;
  if (id === 'operatorVal') {
    // For operator, get the text without (v1) / (S50 New) or copy the last one
    const div = document.getElementById(id);
    const lastDiv = div.querySelector('div:last-child');
    if (lastDiv) {
        text = lastDiv.childNodes[0].textContent.trim();
    }
  }
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
