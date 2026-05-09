/*  Tozed/ZLT Router Password Generator
    Generates Operator, Test & User passwords from IMEI/MAC/SN  */

// ========== MODEL-SPECIFIC CREDENTIALS DATABASE ==========
const MODEL_DB = {
  'ZLT-S50': {
    operator: [
      {u:'admin',p:'admin',n:'Default operator'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
      {u:'admin',p:'tozed521',n:'Alt operator'},
      {u:'admin',p:'zlt123',n:'ZLT default'},
    ],
    test: [
      {u:'test',p:'test',n:'Test account'},
      {u:'debug',p:'debug',n:'Debug mode'},
      {u:'admin',p:'admin123',n:'Test firmware'},
      {u:'test',p:'test123',n:'Test alt'},
    ],
    user: [
      {u:'user',p:'user',n:'Basic user'},
      {u:'user',p:'@l03e1t3',n:'ISP user firmware'},
      {u:'admin',p:'admin',n:'Default login'},
    ],
    gateway: '192.168.0.1',
  },
  'ZLT-S12-Pro': {
    operator: [
      {u:'admin',p:'admin',n:'Default operator'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
      {u:'root',p:'dilu1212',n:'DiluWRT custom FW'},
      {u:'admin',p:'zlt123',n:'ZLT default'},
    ],
    test: [
      {u:'test',p:'test',n:'Test account'},
      {u:'debug',p:'debug',n:'Debug access'},
      {u:'admin',p:'test123',n:'Test firmware'},
    ],
    user: [
      {u:'user',p:'user',n:'Basic user'},
      {u:'user',p:'@l03e1t3',n:'ISP user firmware'},
      {u:'admin',p:'admin',n:'Default login'},
    ],
    gateway: '192.168.254.254',
  },
  'ZLT-P11': {
    operator: [
      {u:'admin',p:'admin',n:'Default operator'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
      {u:'admin',p:'zlt123',n:'ZLT default'},
    ],
    test: [
      {u:'test',p:'test',n:'Test account'},
      {u:'debug',p:'debug',n:'Debug mode'},
    ],
    user: [
      {u:'user',p:'user',n:'Basic user'},
      {u:'user',p:'@l03e1t3',n:'ISP user'},
      {u:'admin',p:'admin',n:'Default'},
    ],
    gateway: '192.168.0.1',
  },
  'ZLT-P11x': {
    operator: [
      {u:'admin',p:'admin',n:'Default operator'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
      {u:'admin',p:'zlt123',n:'ZLT default'},
    ],
    test: [
      {u:'test',p:'test',n:'Test account'},
      {u:'debug',p:'debug',n:'Debug mode'},
    ],
    user: [
      {u:'user',p:'user',n:'Basic user'},
      {u:'user',p:'@l03e1t3',n:'ISP user'},
      {u:'admin',p:'admin',n:'Default'},
    ],
    gateway: '192.168.0.1',
  },
  'ZLT-V20-Pro': {
    operator: [
      {u:'admin',p:'admin',n:'Default operator'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
      {u:'admin',p:'tozed521',n:'Alt operator'},
      {u:'admin',p:'zlt123',n:'ZLT default'},
    ],
    test: [
      {u:'test',p:'test',n:'Test account'},
      {u:'debug',p:'debug',n:'Debug mode'},
      {u:'admin',p:'admin123',n:'Test firmware'},
    ],
    user: [
      {u:'user',p:'user',n:'Basic user'},
      {u:'user',p:'@l03e1t3',n:'ISP user firmware'},
      {u:'admin',p:'admin',n:'Default login'},
    ],
    gateway: '192.168.70.1',
  },
  'ZLT-S10G': {
    operator: [
      {u:'admin',p:'admin',n:'Default'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
    ],
    test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'}],
    user: [{u:'user',p:'user',n:'User'},{u:'user',p:'@l03e1t3',n:'ISP user'},{u:'admin',p:'admin',n:'Default'}],
    gateway: '192.168.254.254',
  },
  'ZLT-S12': {
    operator: [
      {u:'admin',p:'admin',n:'Default'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
      {u:'admin',p:'Tozed@521',n:'Operator firmware'},
    ],
    test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'}],
    user: [{u:'user',p:'user',n:'User'},{u:'user',p:'@l03e1t3',n:'ISP user'},{u:'admin',p:'admin',n:'Default'}],
    gateway: '192.168.254.254',
  },
  'SEI-120G': {
    operator: [
      {u:'admin',p:'admin',n:'Default'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
    ],
    test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'}],
    user: [{u:'user',p:'user',n:'User'},{u:'admin',p:'admin',n:'Default'}],
    gateway: '192.168.0.1',
  },
  'ZLT-M30S': {
    operator: [
      {u:'admin',p:'admin',n:'Default (CVE-2025-14126: hardcoded creds)'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
    ],
    test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'}],
    user: [{u:'user',p:'user',n:'User'},{u:'admin',p:'admin',n:'Default'}],
    gateway: '192.168.0.1',
  },
  'ZLT-W51': {
    operator: [
      {u:'admin',p:'admin',n:'Default (CVE-2025-5105: port 7777 vuln)'},
      {u:'sztozed',p:'83583000',n:'Superadmin #1'},
      {u:'sztozed',p:'44433618',n:'Superadmin #2'},
    ],
    test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'}],
    user: [{u:'user',p:'user',n:'User'},{u:'admin',p:'admin',n:'Default'}],
    gateway: '192.168.0.1',
  },
};

// Fallback for OTHER / unknown models
MODEL_DB['OTHER'] = {
  operator: [
    {u:'admin',p:'admin',n:'Most common default'},
    {u:'sztozed',p:'83583000',n:'Superadmin #1'},
    {u:'sztozed',p:'44433618',n:'Superadmin #2'},
    {u:'admin',p:'Tozed@521',n:'Operator firmware'},
    {u:'admin',p:'tozed521',n:'Alt operator'},
    {u:'admin',p:'zlt123',n:'ZLT default'},
    {u:'superadmin',p:'superadmin',n:'Generic superadmin'},
  ],
  test: [{u:'test',p:'test',n:'Test'},{u:'debug',p:'debug',n:'Debug'},{u:'admin',p:'test123',n:'Test alt'}],
  user: [{u:'user',p:'user',n:'User'},{u:'user',p:'@l03e1t3',n:'ISP user'},{u:'admin',p:'admin',n:'Default'}],
  gateway: '192.168.0.1',
};

// ISP-specific extra credentials
const ISP_CREDS = {
  dialog:  [{l:'operator',u:'admin',p:'dialog123',n:'Dialog SL'},{l:'operator',u:'admin',p:'Dialog@123',n:'Dialog SL alt'}],
  mobitel: [{l:'operator',u:'admin',p:'mobitel123',n:'Mobitel SL'},{l:'operator',u:'admin',p:'Mobitel@123',n:'Mobitel alt'}],
  slt:     [{l:'operator',u:'admin',p:'slt@123',n:'SLT firmware'},{l:'operator',u:'admin',p:'slt123',n:'SLT alt'}],
  hutch:   [{l:'operator',u:'admin',p:'hutch@123',n:'Hutch SL'}],
  globe:   [{l:'operator',u:'admin',p:'globe@home',n:'Globe PH'},{l:'operator',u:'admin',p:'homed@ta',n:'Globe home data'}],
  dito:    [{l:'operator',u:'admin',p:'dito@2021',n:'DITO PH'}],
  smart:   [{l:'operator',u:'admin',p:'smart@bro',n:'Smart PH'}],
  du:      [{l:'operator',u:'admin',p:'du@admin',n:'Du UAE'}],
  ooredoo: [{l:'operator',u:'admin',p:'ooredoo123',n:'Ooredoo'}],
  mtn:     [{l:'operator',u:'admin',p:'mtn@admin',n:'MTN'}],
  vodacom: [{l:'operator',u:'admin',p:'vodacom123',n:'Vodacom'}],
};

// ========== STATE ==========
let selectedModel = '';

// ========== MODEL SELECTION ==========
function selectModel(el) {
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedModel = el.dataset.model;
}

// ========== INPUT HELPERS ==========
function validateImei(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
  document.getElementById('imeiCount').textContent = input.value.length + '/15';
}

function formatMac(input) {
  let v = input.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (v.length > 12) v = v.slice(0, 12);
  let f = '';
  for (let i = 0; i < v.length; i++) {
    if (i > 0 && i % 2 === 0 && i < 12) f += ':';
    f += v[i];
  }
  input.value = f;
}

// ========== PASSWORD GENERATION FROM INPUTS ==========
function genFromIMEI(imei) {
  if (!imei || imei.length < 8) return [];
  const r = [];
  r.push({v:imei.slice(-8), m:'IMEI last 8 digits'});
  r.push({v:imei.slice(-6), m:'IMEI last 6 digits'});
  r.push({v:imei.slice(-4), m:'IMEI last 4 digits'});
  r.push({v:imei.slice(0,8), m:'IMEI first 8 (TAC)'});
  r.push({v:imei.slice(-8).split('').reverse().join(''), m:'IMEI last 8 reversed'});
  if (imei.length >= 12) r.push({v:imei.slice(4,12), m:'IMEI mid 8 (pos 4-11)'});
  r.push({v:'tozed'+imei.slice(-4), m:'"tozed" + last 4'});
  r.push({v:'admin'+imei.slice(-4), m:'"admin" + last 4'});
  r.push({v:imei, m:'Full IMEI'});
  // XOR derivation
  if (imei.length >= 15) {
    const x = ((parseInt(imei.slice(0,8)) ^ parseInt(imei.slice(7,15))) >>> 0);
    r.push({v:String(x).slice(-8).padStart(8,'0'), m:'IMEI XOR derivation'});
  }
  // Digit sum combo
  const sum = imei.split('').reduce((a,b)=>a+parseInt(b),0);
  r.push({v:String(sum).padStart(4,'0')+imei.slice(-4), m:'Digit sum + last 4'});
  return r;
}

function genFromMAC(mac) {
  if (!mac || mac.length < 8) return [];
  const c = mac.replace(/[:\-\.]/g,'').toUpperCase();
  if (c.length < 6) return [];
  const r = [];
  r.push({v:c.slice(-6), m:'MAC last 6 hex'});
  if (c.length >= 8) r.push({v:c.slice(-8), m:'MAC last 8 hex'});
  r.push({v:c.slice(-6).toLowerCase(), m:'MAC last 6 lowercase'});
  r.push({v:String(parseInt(c.slice(-4),16)), m:'MAC last 4 → decimal'});
  r.push({v:c, m:'Full MAC (no sep)'});
  r.push({v:c.toLowerCase(), m:'Full MAC lowercase'});
  return r;
}

function genFromSerial(sn) {
  if (!sn || sn.length < 4) return [];
  const r = [];
  r.push({v:sn.slice(-8), m:'Serial last 8'});
  r.push({v:sn.slice(-6), m:'Serial last 6'});
  r.push({v:sn.slice(-4), m:'Serial last 4'});
  r.push({v:sn, m:'Full serial'});
  return r;
}

function genCombined(imei, mac, sn) {
  const r = [];
  const cm = mac ? mac.replace(/[:\-\.]/g,'').toUpperCase() : '';
  if (imei && imei.length >= 4 && cm.length >= 4) {
    r.push({v:imei.slice(-4)+cm.slice(-4), m:'IMEI4 + MAC4'});
    r.push({v:cm.slice(-4)+imei.slice(-4), m:'MAC4 + IMEI4'});
  }
  if (imei && imei.length >= 4 && sn && sn.length >= 4) {
    r.push({v:sn.slice(-4)+imei.slice(-4), m:'SN4 + IMEI4'});
  }
  return r;
}

// ========== MAIN GENERATE ==========
function generatePasswords() {
  const imei = document.getElementById('imeiInput').value.trim();
  const mac = document.getElementById('macInput').value.trim();
  const sn = document.getElementById('serialInput').value.trim();
  const isp = document.getElementById('ispSelect').value;
  const model = selectedModel || 'OTHER';

  if (!imei && !mac && !sn && model === 'OTHER') {
    alert('Please select a model or enter at least one value (IMEI, MAC, or Serial Number).');
    return;
  }

  const db = MODEL_DB[model] || MODEL_DB['OTHER'];

  // ---- Build 3 password type lists ----
  // Operator passwords
  let opList = [...db.operator];
  if (isp && ISP_CREDS[isp]) ISP_CREDS[isp].forEach(c => { if(c.l==='operator') opList.push({u:c.u,p:c.p,n:c.n}); });
  // Add IMEI-derived as operator candidates
  if (imei && imei.length >= 8) {
    opList.push({u:'admin', p:imei.slice(-8), n:'IMEI last 8'});
    opList.push({u:'admin', p:imei.slice(-6), n:'IMEI last 6'});
    opList.push({u:'sztozed', p:imei.slice(-8), n:'sztozed + IMEI8'});
  }
  if (mac) {
    const cm = mac.replace(/[:\-\.]/g,'').toUpperCase();
    if (cm.length >= 6) opList.push({u:'admin', p:cm.slice(-6), n:'MAC last 6'});
  }

  // Test passwords
  let testList = [...db.test];
  if (imei && imei.length >= 4) {
    testList.push({u:'test', p:imei.slice(-4), n:'IMEI last 4'});
    testList.push({u:'test', p:imei.slice(-8), n:'IMEI last 8'});
  }

  // User passwords
  let userList = [...db.user];
  if (imei && imei.length >= 4) {
    userList.push({u:'user', p:imei.slice(-4), n:'IMEI last 4'});
    userList.push({u:'admin', p:imei.slice(-4), n:'IMEI last 4'});
  }
  if (sn && sn.length >= 4) {
    userList.push({u:'admin', p:sn.slice(-8), n:'Serial last 8'});
  }

  // ---- Render 3 columns ----
  renderTypeList('operatorPasswords', dedup(opList));
  renderTypeList('testPasswords', dedup(testList));
  renderTypeList('userPasswords', dedup(userList));

  // ---- Generated passwords from inputs ----
  let genPw = [];
  if (imei) genPw = genPw.concat(genFromIMEI(imei));
  if (mac) genPw = genPw.concat(genFromMAC(mac));
  if (sn) genPw = genPw.concat(genFromSerial(sn));
  genPw = genPw.concat(genCombined(imei, mac, sn));
  // Dedup
  const seen = new Set();
  genPw = genPw.filter(p => { if(seen.has(p.v)) return false; seen.add(p.v); return true; });
  renderGeneratedList('generatedPasswords', genPw);

  // ---- Full credentials table ----
  let allCreds = [];
  db.operator.forEach(c => allCreds.push({...c, l:'operator'}));
  db.test.forEach(c => allCreds.push({...c, l:'test'}));
  db.user.forEach(c => allCreds.push({...c, l:'user'}));
  // Add universal extras
  allCreds.push({l:'super',u:'superadmin',p:'superadmin',n:'Generic'});
  allCreds.push({l:'debug',u:'root',p:'root',n:'If telnet/SSH enabled'});
  allCreds.push({l:'super',u:'root',p:'dilu1212',n:'DiluWRT custom firmware'});
  allCreds.push({l:'admin',u:'admin',p:'1234',n:'Simple numeric'});
  allCreds.push({l:'admin',u:'admin',p:'password',n:'Generic'});
  if (isp && ISP_CREDS[isp]) ISP_CREDS[isp].forEach(c => allCreds.push(c));
  renderCredentialsTable(dedup(allCreds), 'credentialsBody');

  // Model label
  document.getElementById('modelLabel').textContent = model === 'OTHER' ? 'Tozed/ZLT' : model.replace(/-/g,' ');

  // Derived values
  renderDerived(imei, mac, sn, model, isp);

  // Show
  const sec = document.getElementById('resultsSection');
  sec.style.display = 'block';
  setTimeout(() => sec.scrollIntoView({behavior:'smooth', block:'start'}), 150);
}

function dedup(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = (item.u||'') + '|' + (item.p||'');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ========== RENDER FUNCTIONS ==========
function renderTypeList(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = 'pw-type-item';
    d.style.animationDelay = (i * 0.05) + 's';
    d.innerHTML = `
      <span class="pw-user">${esc(item.u)}</span>
      <span class="pw-pass">${esc(item.p)}</span>
      <button class="pw-mini-copy" onclick="copyText('${escJs(item.p)}')" title="Copy password">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.3"/></svg>
      </button>`;
    el.appendChild(d);
  });
  if (!items.length) el.innerHTML = '<div style="color:var(--text-4);font-size:0.78rem;padding:8px">No passwords found</div>';
}

function renderGeneratedList(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = 'password-item';
    d.style.animationDelay = (i * 0.03) + 's';
    d.innerHTML = `
      <div class="pw-num">${i+1}</div>
      <div class="pw-info">
        <div class="pw-value">${esc(item.v)}</div>
        <div class="pw-method">${esc(item.m)}</div>
      </div>
      <button class="pw-copy" onclick="copyText('${escJs(item.v)}')" title="Copy">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.2"/></svg>
      </button>`;
    el.appendChild(d);
  });
  if (!items.length) el.innerHTML = '<div style="color:var(--text-4);font-size:0.82rem;padding:12px">Enter IMEI, MAC, or Serial to generate passwords.</div>';
}

function renderCredentialsTable(creds, tbodyId) {
  const tb = document.getElementById(tbodyId);
  tb.innerHTML = '';
  creds.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="cred-level ${c.l}">${(c.l||'admin').toUpperCase()}</span></td>
      <td><span class="cred-val">${esc(c.u)}</span></td>
      <td><span class="cred-val">${esc(c.p)}</span></td>
      <td><span class="cred-note">${esc(c.n||'')}</span></td>
      <td><button class="cred-copy" onclick="copyText('${escJs(c.p)}')" title="Copy">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.3"/></svg>
      </button></td>`;
    tb.appendChild(tr);
  });
}

function renderDerived(imei, mac, sn, model, isp) {
  const g = document.getElementById('derivedGrid');
  g.innerHTML = '';
  const items = [];
  if (model) items.push({l:'Model', v:model.replace(/-/g,' ')});
  if (isp) items.push({l:'ISP', v:isp.charAt(0).toUpperCase()+isp.slice(1)});
  if (imei) {
    items.push({l:'IMEI Full', v:imei});
    items.push({l:'IMEI Last 8', v:imei.slice(-8)});
    items.push({l:'IMEI Last 6', v:imei.slice(-6)});
    items.push({l:'IMEI Last 4', v:imei.slice(-4)});
    items.push({l:'TAC (First 8)', v:imei.slice(0,8)});
    items.push({l:'Digit Sum', v:String(imei.split('').reduce((a,b)=>a+parseInt(b),0))});
  }
  if (mac) {
    const cm = mac.replace(/[:\-\.]/g,'').toUpperCase();
    items.push({l:'MAC Clean', v:cm});
    items.push({l:'MAC Last 6', v:cm.slice(-6)});
    items.push({l:'MAC Last 4 Hex', v:cm.slice(-4)});
    items.push({l:'MAC Last 4 Dec', v:String(parseInt(cm.slice(-4),16))});
    items.push({l:'OUI Vendor', v:cm.slice(0,6)});
  }
  if (sn) {
    items.push({l:'Serial Full', v:sn});
    items.push({l:'Serial Last 8', v:sn.slice(-8)});
  }
  items.forEach(i => {
    const d = document.createElement('div');
    d.className = 'derived-item';
    d.innerHTML = `<div class="derived-label">${esc(i.l)}</div><div class="derived-value">${esc(i.v)}</div>`;
    g.appendChild(d);
  });
}

// ========== UTILS ==========
function esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function escJs(s) { return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(()=>showToast('Copied!')).catch(()=>fbCopy(text));
  } else fbCopy(text);
}
function fbCopy(text) {
  const t=document.createElement('textarea'); t.value=text; t.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(t); t.select();
  try{document.execCommand('copy');showToast('Copied!');}catch{showToast('Copy failed');}
  document.body.removeChild(t);
}
function showToast(msg) {
  const t=document.getElementById('toast');
  document.getElementById('toastMessage').textContent=msg;
  t.classList.add('visible');
  setTimeout(()=>t.classList.remove('visible'),2000);
}
