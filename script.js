(() => {
  const fileInput = document.getElementById('fileInput');
  const drop = document.getElementById('drop');
  const convertBtn = document.getElementById('convert');
  const clearBtn = document.getElementById('clear');
  const fileList = document.getElementById('fileList');
  const count = document.getElementById('count');
  const logEl = document.getElementById('log');

  let files = [];

  // UI Handling
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => addFiles(fileInput.files));

  clearBtn.addEventListener('click', () => { files = []; fileInput.value = ''; updateUI(); log('Cleared.'); });
  convertBtn.addEventListener('click', async () => {
    if (!files.length) { log('Add some JSON files first.'); return; }
    log('Converting…');

    try {
      const rows = [];
      for (const f of files) {
        const json = await readJsonFile(f);
        rows.push(mapCompanyRow(json));
      }
      const headers = [
        'profileURL', 'location', 'mutual connections', 'about',
        'website', 'emails', 'phones', 'birthday', 'address',
        'twitter', 'instagram', 'wechat', 'whatsapp', 'telegram',
        'other', 'connectedOn', 'educations'
      ];
      const csv = rowsToCsv(rows, headers);
      triggerDownload(csv, 'profiles.csv');
      log(`Done. Wrote ${rows.length} row(s) to profiles.csv.`);
    } catch (err) {
      console.error(err);
      log('Error: ' + (err?.message || String(err)));
    }
  });

  // Helpers
  function addFiles(list) {
    for (const f of list) {
      if (f.name.toLowerCase().endsWith('.json')) files.push(f);
    }
    updateUI();
  }
  function updateUI() {
    count.textContent = files.length ? `${files.length} file(s) ready.` : 'No files selected yet.';
    fileList.innerHTML = files.map(f => `• <code>${escapeHtml(f.name)}</code> (${formatBytes(f.size)})`).join('<br>');
  }
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }
  function log(msg) {
    logEl.hidden = false;
    logEl.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  }

  // Read JSON file
  function readJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.onload = () => {
        try {
          let text = reader.result;
          if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // remove BOM if any
          resolve(JSON.parse(text));
        } catch {
          reject(new Error(`Invalid JSON in ${file.name}`));
        }
      };
      reader.readAsText(file);
    });
  }

  // Map JSON → one CSV row
  function mapCompanyRow(obj) {
    const c = obj?.contact || {};

    // Only use contact.websites; exclude any LinkedIn URLs
    const websites = joinLines(filterWebsites(c.websites));

    return {
      'profileURL': safeStr(obj?.profileURL),
      'location': safeStr(obj?.location),
      'mutual connections': safeStr(obj?.mutualConnections),
      'about': safeStr(obj?.about),
      'website': websites,
      'emails': joinLines(c.emails),
      'phones': joinLines(c.phones),
      'birthday': safeStr(c.birthday),
      'address': safeStr(c.address),
      'twitter': joinLines(c.twitter),
      'instagram': joinLines(c.instagram),
      'wechat': joinLines(c.wechat),
      'whatsapp': joinLines(c.whatsapp),
      'telegram': joinLines(c.telegram),
      'other': joinLines(c.other),
      'connectedOn': safeStr(c.connectedOn),
      'educations': formatEducations(obj?.education)
    };
  }

  // Utilities for text normalization
  function safeStr(v) { return (v === null || v === undefined) ? '' : String(v); }
  function joinLines(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return arr.map(x => safeStr(x)).filter(Boolean).join('\n'); // newline inside the cell
  }
  function isLinkedInUrl(u) {
    try {
      const url = new URL(String(u));
      return url.hostname.toLowerCase().includes('linkedin.com');
    } catch {
      // If it's not a valid URL string, fallback regex check
      return /linkedin\.com/i.test(String(u || ''));
    }
  }
  function filterWebsites(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => !isLinkedInUrl(x));
  }
  function formatEducations(edu) {
    if (!Array.isArray(edu) || !edu.length) return '';
    return edu.map(e => {
      return `school: ${safeStr(e?.school)}\ndegree: ${safeStr(e?.degree)}\ndates: ${safeStr(e?.dates)}`;
    }).join('\n\n'); // blank line between entries
  }

  // CSV writer (UTF-8 BOM for Excel)
  function rowsToCsv(rows, headers) {
    const escapeCell = (v) => '"' + (v ? String(v).replace(/"/g, '""') : '') + '"';
    const lines = [];
    lines.push(headers.map(h => escapeCell(h)).join(','));
    for (const r of rows) {
      const row = headers.map(h => escapeCell(r[h]));
      lines.push(row.join(','));
    }
    return lines.join('\r\n'); // CRLF line endings
  }

  function triggerDownload(csvText, filename = 'profiles.csv') {
    const bom = '\uFEFF'; // ensure Excel opens as UTF-8
    const blob = new Blob([bom, csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }
})();
