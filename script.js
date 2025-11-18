(() => {
  const fileInput  = document.getElementById('fileInput');
  const drop       = document.getElementById('drop');
  const convertBtn = document.getElementById('convert');
  const clearBtn   = document.getElementById('clear');
  const fileList   = document.getElementById('fileList');
  const count      = document.getElementById('count');
  const logEl      = document.getElementById('log');

  let files = [];

  // ---------- FIXED HEADERS ----------
  const HEADERS = [
    "profileURL",
    "fullName",
    "firstName",
    "lastName",
    "connectionDegree",
    "currentOrganization",
    "currentOrganizationUrl",
    "lastSchool",
    "lastSchoolUrl",
    "city",
    "country",
    "mutualConnections",
    "mutualConnectionsCount",
    "about",
    "contact.profileUrl",
    "contact.website1",
    "contact.website2",
    "contact.website3",
    "contact.email1",
    "contact.email2",
    "contact.email3",
    "contact.phone1",
    "contact.phone2",
    "contact.phone3",
    "contact.birthday",
    "contact.address",
    "contact.twitter",
    "contact.instagram",
    "contact.wechat",
    "contact.whatsapp",
    "contact.telegram",
    "contact.other",
    "contact.connectedOn",
    "experience 1 organization",
    "experience 1 organization url",
    "experience 1 job role",
    "experience 1 start date",
    "experience 1 end date",
    "experience 1 location",
    "experience 1 role type",
    "experience 1 location type",
    "experience 2 organization",
    "experience 2 organization url",
    "experience 2 job role",
    "experience 2 start date",
    "experience 2 end date",
    "experience 2 location",
    "experience 2 role type",
    "experience 2 location type",
    "experience 3 organization",
    "experience 3 organization url",
    "experience 3 job role",
    "experience 3 start date",
    "experience 3 end date",
    "experience 3 location",
    "experience 3 role type",
    "experience 3 location type",
    "experience 4 organization",
    "experience 4 organization url",
    "experience 4 job role",
    "experience 4 start date",
    "experience 4 end date",
    "experience 4 location",
    "experience 4 role type",
    "experience 4 location type",
    "experience 5 organization",
    "experience 5 organization url",
    "experience 5 job role",
    "experience 5 start date",
    "experience 5 end date",
    "experience 5 location",
    "experience 5 role type",
    "experience 5 location type",
    "school 1",
    "school 1 url",
    "degree 1",
    "degree 1 start date",
    "degree 1 end date",
    "school 2",
    "school 2 url",
    "degree 2",
    "degree 2 start date",
    "degree 2 end date"
  ];

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
      const rows = [];
      for (const f of files) {
        const obj = await readJsonFile(f);
        rows.push(mapJsonToFixedRow(obj));
      }

      const csv = rowsToCsv(rows, HEADERS);
      triggerDownload(csv, 'profiles.csv');
      logMsg(`Done. ${rows.length} row(s), ${HEADERS.length} column(s).`);
    } catch (err) {
      console.error(err);
      logMsg('Error: ' + (err && err.message ? err.message : String(err)));
    }
  });

  // ---------- Helpers ----------

  function addFiles(listLike) {
    for (const f of listLike) {
      if (f.name.toLowerCase().endsWith('.json')) files.push(f);
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
          if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
          resolve(JSON.parse(text));
        } catch {
          reject(new Error(`Invalid JSON in ${file.name}`));
        }
      };
      reader.readAsText(file);
    });
  }

  // ---------- Mapping JSON → fixed row ----------
  function mapJsonToFixedRow(obj) {
    const row = {};
    const contact = obj && obj.contact ? obj.contact : {};

    for (const h of HEADERS) {
      let value = "";

      if (h.startsWith("contact.")) {
        // contact.something → get property from contact object
        const key = h.substring("contact.".length); // e.g. "website1"
        value = contact[key];
      } else {
        // all other headers are top-level keys
        value = obj[h];
      }

      row[h] = toCell(value);
    }

    return row;
  }

  function toCell(v) {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v)) {
      // for completeness: join arrays with newline if they ever appear
      return v.map(x => x == null ? "" : String(x)).filter(x => x !== "").join("\n");
    }
    return String(v);
  }

  // ---------- CSV + download helpers ----------

  function rowsToCsv(rows, headers) {
    const quote = (val) => {
      const str = val === null || val === undefined ? "" : String(val);
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
    const bom  = '\uFEFF'; // UTF-8 BOM so Excel sees UTF-8 and keeps newlines
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

  // ---------- Misc UI helpers ----------

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
