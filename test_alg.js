const AMBIGUOUS = '1ILil';

function alphabetChar(m) {
    if (m < 10) return 48 + m; // 0-9
    if (m < 36) return 55 + m; // A-Z (65-90)
    return 61 + m; // a-z (97-122)
}

function generateFrom(data, mod, opts = {}) {
    const filterAmbiguous = opts.filterAmbiguous !== false;
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
        let ch = alphabetChar(seed % mod);
        if (filterAmbiguous && AMBIGUOUS.includes(String.fromCharCode(ch))) ch += 1;
        out[i] = ch;
    }
    return String.fromCharCode(...out);
}

const imei = "862624055623767";
const mac = "D842F7B23A8C";

const dataImei = Array.from(imei).map(c => c.charCodeAt(0));
const dataMacRaw = Array.from(mac).map(c => c.charCodeAt(0));

// Try different combinations
console.log("IMEI % 52:", generateFrom(dataImei, 52));
console.log("IMEI % 62:", generateFrom(dataImei, 62));

// MAC formatted like "D8:42:F7:B2:3A:8C"
const macFormatted = "D8:42:F7:B2:3A:8C";
const dataMacFormatted = Array.from(macFormatted).map(c => c.charCodeAt(0));
console.log("MAC Formatted % 52:", generateFrom(dataMacFormatted, 52));
console.log("MAC Formatted % 62:", generateFrom(dataMacFormatted, 62));

// User said Expected: dA5nzSYa
console.log("Expected: dA5nzSYa");
