(() => {
  const fileInput  = document.getElementById('fileInput');
  const drop       = document.getElementById('drop');
  const convertBtn = document.getElementById('convert');
  const clearBtn   = document.getElementById('clear');
  const fileList   = document.getElementById('fileList');
  const count      = document.getElementById('count');
  const logEl      = document.getElementById('log');

  let files = [];

  // ---------- UI wiring ----------
  drop.addEventListener('click', () => fileInput.click());

  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('dragover');
  });

  drop.addEventListener('dragleave', () => {
    drop.classList.remove('dragover');
  });

  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
  });

  clearBtn.addEventListener('click', () => {
    files = [];
    fileInput.value = '';
    updateUI();
    logMsg('Cleared.');
  });

  convertBtn.addEventListener('click', async () => {
    if (!files.length) {
      logMsg('Add some JSON files first.');
      return;
    }
    logMsg('Reading and converting…');

    try {
      const flatRows = [];     // flattened objects for each JSON
      let headers = [];        // final header order
      let headerIndex = new Map(); // name -> index

      // 1) Read and merge headers in the order you described
      for (const f of files) {
        const obj  = await readJsonFile(f);
        const flat = flattenObject(obj);           // keys in encounter order
        const keys = Object.keys(flat);

        flatRows.push(flat);

        if (headers.length === 0) {
          // First JSON: header = its keys in order
          headers = keys.slice();
          headerIndex = new Map(headers.map((k, i) => [k, i]));
        } else {
          // Merge this JSON's keys into existing header, respecting its local order
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (headerIndex.has(key)) continue; // already known

            // Find previous known key in this JSON
            let insertAt = headers.length; // default: append
            let foundNeighbor = false;

            for (let j = i - 1; j >= 0; j--) {
              const prevKey = keys[j];
              if (headerIndex.has(prevKey)) {
                insertAt = headerIndex.get(prevKey) + 1; // after previous known
                foundNeighbor = true;
                break;
              }
            }

            // If no previous known key, try next known key (insert before it)
            if (!foundNeighbor) {
              for (let j = i + 1; j < keys.length; j++) {
                const nextKey = keys[j];
                if (headerIndex.has(nextKey)) {
                  insertAt = headerIndex.get(nextKey); // before next known
                  foundNeighbor = true;
                  break;
                }
              }
            }

            // Insert new key at calculated position
            headers.splice(insertAt, 0, key);
            // Rebuild headerIndex map (simpler and still cheap at this scale)
            headerIndex = new Map(headers.map((k, idx) => [k, idx]));
          }
        }
      }

      // 2) Build ordered rows using final headers, leaving blanks for missing keys
      const rows = flatRows.map(rowObj => {
        const row = {};
        for (const h of headers) {
          row[h] = h in rowObj ? rowObj[h] : '';
        }
        return row;
      });

      // 3) CSV + download
      const csv = rowsToCsv(rows, headers);
      triggerDownload(csv, 'profiles.csv');
      logMsg(`Done. ${rows.length} row(s), ${headers.length} column(s).`);
    } catch (err) {
      console.error(err);
      logMsg('Error: ' + (err && err.message ? err.message : String(err)));
    }
  });

  // ---------- Helpers ----------

  function addFiles(listLike) {
    for (const f of listLike) {
      if (f.name.toLowerCase().endsWith('.json')) {
        files.push(f);
      }
    }
    updateUI();
  }

  function updateUI() {
    count.textContent = files.length
      ? `${files.length} file(s) ready.`
      : 'No files selected yet.';

    fileList.innerHTML = files
      .map(f => `• <code>${escapeHtml(f.name)}</code> (${formatBytes(f.size)})`)
      .join('<br>');
  }

  function logMsg(msg) {
    logEl.hidden = false;
    logEl.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  }

  function readJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.onload = () => {
        try {
          let text = reader.result;
          if (text && text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1); // strip BOM if present
          }
          const data = JSON.parse(text);
          resolve(data);
        } catch (e) {
          reject(new Error(`Invalid JSON in ${file.name}`));
        }
      };
      reader.readAsText(file);
    });
  }

  // Flatten nested objects into dot-notation keys
  function flattenObject(obj, prefix = '', out = {}) {
    if (obj === null || obj === undefined) {
      if (prefix) out[prefix] = '';
      return out;
    }

    if (Array.isArray(obj)) {
      // If all primitives, join with newlines; else store as JSON string
      if (obj.every(isPrimitive)) {
        out[prefix] = obj.map(v => (v == null ? '' : String(v))).join('\n');
      } else {
        out[prefix] = JSON.stringify(obj);
      }
      return out;
    }

    if (typeof obj !== 'object') {
      if (prefix) out[prefix] = String(obj);
      return out;
    }

    const keys = Object.keys(obj);
    if (!keys.length) {
      if (prefix) out[prefix] = '';
      return out;
    }

    for (const k of keys) {
      const key = prefix ? `${prefix}.${k}` : k;
      const val = obj[k];

      if (val === null || val === undefined) {
        out[key] = '';
      } else if (Array.isArray(val)) {
        if (val.every(isPrimitive)) {
          out[key] = val.map(v => (v == null ? '' : String(v))).join('\n');
        } else {
          out[key] = JSON.stringify(val);
        }
      } else if (typeof val === 'object') {
        flattenObject(val, key, out);
      } else {
        out[key] = String(val);
      }
    }

    return out;
  }

  function isPrimitive(v) {
    return v === null || typeof v !== 'object';
  }

  function rowsToCsv(rows, headers) {
    const quote = (s) => {
      const str = s === null || s === undefined ? '' : String(s);
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const lines = [];
    lines.push(headers.map(h => quote(h)).join(','));

    for (const r of rows) {
      lines.push(headers.map(h => quote(r[h])).join(','));
    }

    // CRLF for Excel
    return lines.join('\r\n');
  }

  function triggerDownload(csvText, filename) {
    const bom  = '\uFEFF'; // UTF-8 BOM so Excel reads encoding & newlines correctly
    const blob = new Blob([bom, csvText], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'profiles.csv';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k     = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i     = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]+/g, (s) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s])
    );
  }
})();
