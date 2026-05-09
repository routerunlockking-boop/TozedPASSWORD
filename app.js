/**
 * Tozed/ZLT Router Password Generator
 * 
 * Generates all possible operator/admin passwords from manually entered
 * IMEI, MAC address, and serial number using known patterns and algorithms.
 */

// ===== Known Default Credentials Database =====
const CREDENTIALS_DB = {
    // Universal defaults (all models)
    universal: [
        { level: 'admin', user: 'admin', pass: 'admin', note: 'Most common default' },
        { level: 'user', user: 'user', pass: 'user', note: 'Basic user access' },
        { level: 'user', user: 'user', pass: '@l03e1t3', note: 'Some ISP firmware' },
    ],

    // Superadmin / Operator credentials
    superadmin: [
        { level: 'super', user: 'sztozed', pass: '83583000', note: 'Common superadmin #1' },
        { level: 'super', user: 'sztozed', pass: '44433618', note: 'Common superadmin #2' },
        { level: 'super', user: 'tozed', pass: 'tozed', note: 'Manufacturer default' },
        { level: 'super', user: 'superadmin', pass: 'superadmin', note: 'Generic superadmin' },
        { level: 'operator', user: 'admin', pass: 'Tozed@521', note: 'Operator firmware' },
        { level: 'operator', user: 'admin', pass: 'tozed521', note: 'Alt operator firmware' },
        { level: 'super', user: 'debug', pass: 'debug', note: 'Debug access (some FW)' },
        { level: 'super', user: 'root', pass: 'root', note: 'Root access (if telnet enabled)' },
        { level: 'operator', user: 'admin', pass: '1234', note: 'Simple numeric default' },
        { level: 'operator', user: 'admin', pass: 'password', note: 'Generic password' },
    ],

    // ISP-specific
    isp: {
        dialog: [
            { level: 'operator', user: 'admin', pass: 'dialog123', note: 'Dialog SL firmware' },
            { level: 'operator', user: 'admin', pass: 'Dialog@123', note: 'Dialog SL alt' },
            { level: 'admin', user: 'admin', pass: 'admin@dialog', note: 'Dialog branded' },
        ],
        mobitel: [
            { level: 'operator', user: 'admin', pass: 'mobitel123', note: 'Mobitel SL firmware' },
            { level: 'operator', user: 'admin', pass: 'Mobitel@123', note: 'Mobitel SL alt' },
        ],
        slt: [
            { level: 'operator', user: 'admin', pass: 'slt@123', note: 'SLT firmware' },
            { level: 'admin', user: 'admin', pass: 'slt123', note: 'SLT branded' },
        ],
        globe: [
            { level: 'operator', user: 'admin', pass: 'globe@home', note: 'Globe PH firmware' },
            { level: 'admin', user: 'admin', pass: 'GlobeAtHome', note: 'Globe branded' },
            { level: 'operator', user: 'admin', pass: 'homed@ta', note: 'Globe home data' },
        ],
        dito: [
            { level: 'operator', user: 'admin', pass: 'dito@2021', note: 'DITO PH firmware' },
            { level: 'admin', user: 'admin', pass: 'dito', note: 'DITO simple' },
        ],
        smart: [
            { level: 'operator', user: 'admin', pass: 'smart@bro', note: 'Smart PH firmware' },
        ],
        du: [
            { level: 'operator', user: 'admin', pass: 'du@admin', note: 'Du UAE firmware' },
        ],
        ooredoo: [
            { level: 'operator', user: 'admin', pass: 'ooredoo123', note: 'Ooredoo firmware' },
        ],
        hutch: [
            { level: 'operator', user: 'admin', pass: 'hutch@123', note: 'Hutch SL firmware' },
        ],
    },
};


// ===== Password Generation Algorithms =====

/**
 * Generate passwords from IMEI using known patterns
 */
function generateFromIMEI(imei) {
    if (!imei || imei.length < 10) return [];

    const results = [];

    // Pattern 1: Last 8 digits of IMEI
    const last8 = imei.slice(-8);
    results.push({
        value: last8,
        method: 'IMEI last 8 digits',
        priority: 'high',
    });

    // Pattern 2: Last 6 digits
    const last6 = imei.slice(-6);
    results.push({
        value: last6,
        method: 'IMEI last 6 digits',
        priority: 'high',
    });

    // Pattern 3: Last 4 digits
    const last4 = imei.slice(-4);
    results.push({
        value: last4,
        method: 'IMEI last 4 digits',
        priority: 'medium',
    });

    // Pattern 4: First 8 digits
    const first8 = imei.slice(0, 8);
    results.push({
        value: first8,
        method: 'IMEI first 8 digits',
        priority: 'medium',
    });

    // Pattern 5: Reversed last 8 digits
    const revLast8 = last8.split('').reverse().join('');
    results.push({
        value: revLast8,
        method: 'IMEI last 8 digits reversed',
        priority: 'medium',
    });

    // Pattern 6: IMEI digits sum-based
    const digitSum = imei.split('').reduce((a, b) => a + parseInt(b), 0);
    const sumPadded = String(digitSum).padStart(4, '0');
    results.push({
        value: sumPadded + last4,
        method: 'IMEI digit sum + last 4',
        priority: 'low',
    });

    // Pattern 7: Middle 8 digits (positions 4-11)
    if (imei.length >= 12) {
        const mid8 = imei.slice(4, 12);
        results.push({
            value: mid8,
            method: 'IMEI middle 8 digits (pos 4-11)',
            priority: 'medium',
        });
    }

    // Pattern 8: XOR-based derivation
    if (imei.length >= 15) {
        const part1 = parseInt(imei.slice(0, 8));
        const part2 = parseInt(imei.slice(7, 15));
        const xorVal = (part1 ^ part2) >>> 0;
        const xorStr = String(xorVal).slice(-8).padStart(8, '0');
        results.push({
            value: xorStr,
            method: 'IMEI XOR derivation',
            priority: 'low',
        });
    }

    // Pattern 9: TAC-based (first 8 digits = Type Allocation Code)
    results.push({
        value: 'tozed' + last4,
        method: '"tozed" + IMEI last 4',
        priority: 'medium',
    });

    // Pattern 10: admin + last 4
    results.push({
        value: 'admin' + last4,
        method: '"admin" + IMEI last 4',
        priority: 'medium',
    });

    // Pattern 11: Full IMEI as password
    results.push({
        value: imei,
        method: 'Full IMEI as password',
        priority: 'low',
    });

    return results;
}

/**
 * Generate passwords from MAC address
 */
function generateFromMAC(mac) {
    if (!mac || mac.length < 8) return [];

    // Normalize MAC: remove separators
    const cleanMac = mac.replace(/[:\-\.]/g, '').toUpperCase();
    if (cleanMac.length < 6) return [];

    const results = [];

    // Pattern 1: Last 6 hex chars
    const last6hex = cleanMac.slice(-6);
    results.push({
        value: last6hex,
        method: 'MAC last 6 hex chars',
        priority: 'high',
    });

    // Pattern 2: Last 8 hex chars
    if (cleanMac.length >= 8) {
        const last8hex = cleanMac.slice(-8);
        results.push({
            value: last8hex,
            method: 'MAC last 8 hex chars',
            priority: 'high',
        });
    }

    // Pattern 3: Last 6 lowercase
    results.push({
        value: last6hex.toLowerCase(),
        method: 'MAC last 6 hex lowercase',
        priority: 'medium',
    });

    // Pattern 4: Full MAC without separators
    results.push({
        value: cleanMac,
        method: 'Full MAC (no separators)',
        priority: 'low',
    });

    // Pattern 5: Full MAC lowercase
    results.push({
        value: cleanMac.toLowerCase(),
        method: 'Full MAC lowercase',
        priority: 'low',
    });

    // Pattern 6: MAC last 4 hex chars (decimal)
    const last4hex = cleanMac.slice(-4);
    const decimalVal = parseInt(last4hex, 16);
    results.push({
        value: String(decimalVal),
        method: 'MAC last 4 hex → decimal',
        priority: 'medium',
    });

    // Pattern 7: MAC + common prefix
    results.push({
        value: 'tozed' + last6hex.toLowerCase(),
        method: '"tozed" + MAC last 6',
        priority: 'low',
    });

    return results;
}

/**
 * Generate passwords from serial number
 */
function generateFromSerial(serial) {
    if (!serial || serial.length < 4) return [];

    const results = [];

    // Pattern 1: Last 8 chars
    const last8 = serial.slice(-8);
    results.push({
        value: last8,
        method: 'Serial last 8 characters',
        priority: 'high',
    });

    // Pattern 2: Last 6 chars
    const last6 = serial.slice(-6);
    results.push({
        value: last6,
        method: 'Serial last 6 characters',
        priority: 'medium',
    });

    // Pattern 3: Last 4 chars
    const last4 = serial.slice(-4);
    results.push({
        value: last4,
        method: 'Serial last 4 characters',
        priority: 'medium',
    });

    // Pattern 4: Full serial
    results.push({
        value: serial,
        method: 'Full serial number',
        priority: 'low',
    });

    // Pattern 5: Serial reversed
    const reversed = serial.split('').reverse().join('');
    results.push({
        value: reversed.slice(0, 8),
        method: 'Serial reversed (first 8)',
        priority: 'low',
    });

    return results;
}

/**
 * Generate combined passwords from multiple inputs
 */
function generateCombined(imei, mac, serial) {
    const results = [];
    const cleanMac = mac ? mac.replace(/[:\-\.]/g, '').toUpperCase() : '';

    // Combo 1: IMEI last 4 + MAC last 4
    if (imei && imei.length >= 4 && cleanMac.length >= 4) {
        results.push({
            value: imei.slice(-4) + cleanMac.slice(-4),
            method: 'IMEI last 4 + MAC last 4',
            priority: 'medium',
        });
    }

    // Combo 2: MAC last 4 + IMEI last 4
    if (imei && imei.length >= 4 && cleanMac.length >= 4) {
        results.push({
            value: cleanMac.slice(-4) + imei.slice(-4),
            method: 'MAC last 4 + IMEI last 4',
            priority: 'medium',
        });
    }

    // Combo 3: Serial last 4 + IMEI last 4
    if (imei && imei.length >= 4 && serial && serial.length >= 4) {
        results.push({
            value: serial.slice(-4) + imei.slice(-4),
            method: 'Serial last 4 + IMEI last 4',
            priority: 'low',
        });
    }

    return results;
}


// ===== UI Functions =====

function validateImei(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    document.getElementById('imeiCount').textContent = `${input.value.length}/15`;
}

function formatMac(input) {
    // Auto-format MAC as user types
    let val = input.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (val.length > 12) val = val.slice(0, 12);
    // Insert colons every 2 chars
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 2 === 0 && i < 12) formatted += ':';
        formatted += val[i];
    }
    input.value = formatted;
}

function onModelChange() {
    // Could pre-fill known defaults based on model
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
}

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Copied!')).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied!'); }
    catch { showToast('Copy failed'); }
    document.body.removeChild(ta);
}

// ===== Main Generate Function =====
function generatePasswords() {
    const imei = document.getElementById('imeiInput').value.trim();
    const mac = document.getElementById('macInput').value.trim();
    const serial = document.getElementById('serialInput').value.trim();
    const model = document.getElementById('routerModel').value;
    const isp = document.getElementById('ispSelect').value;

    // Need at least one input
    if (!imei && !mac && !serial) {
        alert('Please enter at least one value: IMEI, MAC address, or Serial number.');
        return;
    }

    // Generate passwords from all sources
    let allPasswords = [];

    if (imei) allPasswords = allPasswords.concat(generateFromIMEI(imei));
    if (mac) allPasswords = allPasswords.concat(generateFromMAC(mac));
    if (serial) allPasswords = allPasswords.concat(generateFromSerial(serial));
    allPasswords = allPasswords.concat(generateCombined(imei, mac, serial));

    // Remove duplicates
    const seen = new Set();
    allPasswords = allPasswords.filter(pw => {
        if (seen.has(pw.value)) return false;
        seen.add(pw.value);
        return true;
    });

    // Sort: high priority first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allPasswords.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Build credentials list
    let credentials = [...CREDENTIALS_DB.universal, ...CREDENTIALS_DB.superadmin];
    if (isp && CREDENTIALS_DB.isp[isp]) {
        credentials = [...CREDENTIALS_DB.isp[isp], ...credentials];
    }

    // Display results
    displayPasswords(allPasswords);
    displayCredentials(credentials);
    displayDerived(imei, mac, serial, model, isp);

    // Show results section
    const section = document.getElementById('resultsSection');
    section.style.display = 'block';
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

function displayPasswords(passwords) {
    const container = document.getElementById('passwordsList');
    container.innerHTML = '';

    passwords.forEach((pw, i) => {
        const item = document.createElement('div');
        item.className = 'password-item';
        item.style.animationDelay = `${i * 0.04}s`;

        item.innerHTML = `
            <div class="pw-priority ${pw.priority}">${i + 1}</div>
            <div class="pw-info">
                <div class="pw-value">${escapeHtml(pw.value)}</div>
                <div class="pw-method">${escapeHtml(pw.method)}</div>
            </div>
            <button class="pw-copy" onclick="copyText('${escapeJs(pw.value)}')" title="Copy">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.2"/>
                </svg>
            </button>
        `;

        container.appendChild(item);
    });
}

function displayCredentials(credentials) {
    const tbody = document.getElementById('credentialsBody');
    tbody.innerHTML = '';

    credentials.forEach(cred => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="cred-level ${cred.level}">${cred.level.toUpperCase()}</span></td>
            <td><span class="cred-val">${escapeHtml(cred.user)}</span></td>
            <td><span class="cred-val">${escapeHtml(cred.pass)}</span></td>
            <td><span class="cred-note">${escapeHtml(cred.note)}</span></td>
            <td>
                <button class="cred-copy" onclick="copyText('${escapeJs(cred.user)}\\n${escapeJs(cred.pass)}')" title="Copy both">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                        <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.3"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function displayDerived(imei, mac, serial, model, isp) {
    const grid = document.getElementById('derivedGrid');
    grid.innerHTML = '';

    const cleanMac = mac ? mac.replace(/[:\-\.]/g, '').toUpperCase() : '';

    const items = [];

    if (imei) {
        items.push({ label: 'IMEI (Full)', value: imei });
        items.push({ label: 'IMEI Last 8', value: imei.slice(-8) });
        items.push({ label: 'IMEI Last 6', value: imei.slice(-6) });
        items.push({ label: 'IMEI Last 4', value: imei.slice(-4) });
        items.push({ label: 'TAC (First 8)', value: imei.slice(0, 8) });

        // IMEI checksum digit
        items.push({ label: 'Check Digit', value: imei.slice(-1) });

        // Digit sum
        const sum = imei.split('').reduce((a, b) => a + parseInt(b), 0);
        items.push({ label: 'Digit Sum', value: String(sum) });
    }

    if (cleanMac) {
        items.push({ label: 'MAC (Clean)', value: cleanMac });
        items.push({ label: 'MAC Last 6', value: cleanMac.slice(-6) });
        items.push({ label: 'MAC Last 4 (Hex)', value: cleanMac.slice(-4) });
        items.push({ label: 'MAC Last 4 (Dec)', value: String(parseInt(cleanMac.slice(-4), 16)) });
        items.push({ label: 'OUI (Vendor)', value: cleanMac.slice(0, 6) });
    }

    if (serial) {
        items.push({ label: 'Serial (Full)', value: serial });
        items.push({ label: 'Serial Last 8', value: serial.slice(-8) });
    }

    if (model) items.push({ label: 'Model', value: model });
    if (isp) items.push({ label: 'ISP', value: isp.charAt(0).toUpperCase() + isp.slice(1) });

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'derived-item';
        div.innerHTML = `
            <div class="derived-label">${escapeHtml(item.label)}</div>
            <div class="derived-value">${escapeHtml(item.value)}</div>
        `;
        grid.appendChild(div);
    });
}

// ===== Utilities =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeJs(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
