// // handles only profiles

// (() => {
//   const fileInput  = document.getElementById('fileInput');
//   const drop       = document.getElementById('drop');
//   const convertBtn = document.getElementById('convert');
//   const clearBtn   = document.getElementById('clear');
//   const fileList   = document.getElementById('fileList');
//   const count      = document.getElementById('count');
//   const logEl      = document.getElementById('log');

//   let files = [];

//   // ---------- FIXED HEADERS ----------
//   const HEADERS = [
//     "profileURL",
//     "fullName",
//     "firstName",
//     "lastName",
//     "connectionDegree",
//     "currentOrganization",
//     "currentOrganizationUrl",
//     "lastSchool",
//     "lastSchoolUrl",
//     "city",
//     "country",
//     "mutualConnections",
//     "mutualConnectionsCount",
//     "about",
//     "contact.profileUrl",
//     "contact.website1",
//     "contact.website2",
//     "contact.website3",
//     "contact.email1",
//     "contact.email2",
//     "contact.email3",
//     "contact.phone1",
//     "contact.phone2",
//     "contact.phone3",
//     "contact.birthday",
//     "contact.address",
//     "contact.twitter",
//     "contact.instagram",
//     "contact.wechat",
//     "contact.whatsapp",
//     "contact.telegram",
//     "contact.other",
//     "contact.connectedOn",
//     "experience 1 organization",
//     "experience 1 organization url",
//     "experience 1 job role",
//     "experience 1 start date",
//     "experience 1 end date",
//     "experience 1 location",
//     "experience 1 role type",
//     "experience 1 location type",
//     "experience 2 organization",
//     "experience 2 organization url",
//     "experience 2 job role",
//     "experience 2 start date",
//     "experience 2 end date",
//     "experience 2 location",
//     "experience 2 role type",
//     "experience 2 location type",
//     "experience 3 organization",
//     "experience 3 organization url",
//     "experience 3 job role",
//     "experience 3 start date",
//     "experience 3 end date",
//     "experience 3 location",
//     "experience 3 role type",
//     "experience 3 location type",
//     "experience 4 organization",
//     "experience 4 organization url",
//     "experience 4 job role",
//     "experience 4 start date",
//     "experience 4 end date",
//     "experience 4 location",
//     "experience 4 role type",
//     "experience 4 location type",
//     "experience 5 organization",
//     "experience 5 organization url",
//     "experience 5 job role",
//     "experience 5 start date",
//     "experience 5 end date",
//     "experience 5 location",
//     "experience 5 role type",
//     "experience 5 location type",
//     "school 1",
//     "school 1 url",
//     "degree 1",
//     "degree 1 start date",
//     "degree 1 end date",
//     "school 2",
//     "school 2 url",
//     "degree 2",
//     "degree 2 start date",
//     "degree 2 end date"
//   ];

//   // ---------- UI wiring ----------
//   drop.addEventListener('click', () => fileInput.click());

//   drop.addEventListener('dragover', (e) => {
//     e.preventDefault();
//     drop.classList.add('dragover');
//   });

//   drop.addEventListener('dragleave', () => {
//     drop.classList.remove('dragover');
//   });

//   drop.addEventListener('drop', (e) => {
//     e.preventDefault();
//     drop.classList.remove('dragover');
//     if (e.dataTransfer && e.dataTransfer.files) {
//       addFiles(e.dataTransfer.files);
//     }
//   });

//   fileInput.addEventListener('change', () => {
//     addFiles(fileInput.files);
//   });

//   clearBtn.addEventListener('click', () => {
//     files = [];
//     fileInput.value = '';
//     updateUI();
//     logMsg('Cleared.');
//   });

//   convertBtn.addEventListener('click', async () => {
//     if (!files.length) {
//       logMsg('Add some JSON files first.');
//       return;
//     }
//     logMsg('Reading and converting…');

//     try {
//       const rows = [];
//       for (const f of files) {
//         const obj = await readJsonFile(f);
//         rows.push(mapJsonToFixedRow(obj));
//       }

//       const csv = rowsToCsv(rows, HEADERS);
//       triggerDownload(csv, 'profiles.csv');
//       logMsg(`Done. ${rows.length} row(s), ${HEADERS.length} column(s).`);
//     } catch (err) {
//       console.error(err);
//       logMsg('Error: ' + (err && err.message ? err.message : String(err)));
//     }
//   });

//   // ---------- File handling & ordering ----------

//   function addFiles(listLike) {
//     for (const f of listLike) {
//       if (f.name.toLowerCase().endsWith('.json')) files.push(f);
//     }

//     // Natural sort with special handling for "base (n).json"
//     const collator = new Intl.Collator(undefined, {
//       numeric: true,
//       sensitivity: 'base'
//     });

//     const parseName = (name) => {
//       // "profile_data (3).json" -> base="profile_data", index=3
//       // "profile_data.json"     -> base="profile_data", index=0
//       const m = /^(.*?)(?:\s*\((\d+)\))?(\.[^.]+)?$/.exec(name);
//       return {
//         base: m ? m[1] : name,
//         index: m && m[2] ? parseInt(m[2], 10) : 0
//       };
//     };

//     files.sort((a, b) => {
//       const pa = parseName(a.name);
//       const pb = parseName(b.name);

//       const baseCmp = collator.compare(pa.base, pb.base);
//       if (baseCmp !== 0) return baseCmp;

//       if (pa.index !== pb.index) return pa.index - pb.index;

//       return collator.compare(a.name, b.name);
//     });

//     updateUI();
//   }

//   function updateUI() {
//     count.textContent = files.length
//       ? `${files.length} file(s) ready.`
//       : 'No files selected yet.';
//     fileList.innerHTML = files
//       .map(f => `• <code>${escapeHtml(f.name)}</code> (${formatBytes(f.size)})`)
//       .join('<br>');
//   }

//   function logMsg(msg) {
//     logEl.hidden = false;
//     logEl.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
//   }

//   // ---------- File reading ----------

//   function readJsonFile(file) {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
//       reader.onload = () => {
//         try {
//           let text = reader.result;
//           if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
//           resolve(JSON.parse(text));
//         } catch {
//           reject(new Error(`Invalid JSON in ${file.name}`));
//         }
//       };
//       reader.readAsText(file);
//     });
//   }

//   // ---------- Mapping JSON → fixed row ----------

//   function mapJsonToFixedRow(obj) {
//     const row = {};
//     const contact = obj && obj.contact ? obj.contact : {};

//     for (const h of HEADERS) {
//       let value = "";

//       if (h.startsWith("contact.")) {
//         // contact.something → property inside contact
//         const key = h.substring("contact.".length); // e.g. "website1"
//         value = contact[key];
//       } else if (h === "mutualConnectionsCount") {
//         value = extractMutualCount(obj?.mutualConnections);
//       } else if (h === "city" || h === "country") {
//         // Use explicit fields if present; otherwise derive from location string
//         if (obj.city || obj.country) {
//           value = h === "city" ? obj.city : obj.country;
//         } else {
//           const location = obj?.location || "";
//           const parts = location.split(',').map(p => p.trim()).filter(Boolean);
//           if (h === "city") {
//             value = parts[0] || "";
//           } else {
//             value = parts.length ? parts[parts.length - 1] : "";
//           }
//         }
//       } else {
//         // top-level key (experience 1 organization, school 1, etc.)
//         value = obj[h];
//       }

//       row[h] = toCell(value);
//     }

//     return row;
//   }

//   function toCell(v) {
//     if (v === null || v === undefined) return "";
//     if (Array.isArray(v)) {
//       return v
//         .map(x => (x == null ? "" : String(x)))
//         .filter(x => x !== "")
//         .join("\n");
//     }
//     return String(v);
//   }

//   function extractMutualCount(text) {
//     const m = /\b(\d{1,5})\b(?=\s+other\s+mutual\s+connections)/i.exec(text || "");
//     return m ? m[1] : "";
//   }

//   // ---------- CSV + download helpers ----------

//   function rowsToCsv(rows, headers) {
//     const quote = (val) => {
//       const str = val === null || val === undefined ? "" : String(val);
//       return '"' + str.replace(/"/g, '""') + '"';
//     };

//     const lines = [];
//     lines.push(headers.map(h => quote(h)).join(','));
//     for (const r of rows) {
//       lines.push(headers.map(h => quote(r[h])).join(','));
//     }
//     // CRLF for Excel
//     return lines.join('\r\n');
//   }

//   function triggerDownload(csvText, filename) {
//     const bom  = '\uFEFF'; // UTF-8 BOM so Excel sees UTF-8 and keeps newlines
//     const blob = new Blob([bom, csvText], { type: 'text/csv;charset=utf-8;' });
//     const url  = URL.createObjectURL(blob);

//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename || 'profiles.csv';
//     a.style.display = 'none';

//     document.body.appendChild(a);
//     a.click();
//     setTimeout(() => {
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     }, 0);
//   }

//   // ---------- Misc UI helpers ----------

//   function formatBytes(bytes) {
//     if (bytes === 0) return '0 B';
//     const k     = 1024;
//     const sizes = ['B', 'KB', 'MB', 'GB'];
//     const i     = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   function escapeHtml(str) {
//     return String(str).replace(/[&<>"]+/g, (s) =>
//       ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s])
//     );
//   }
// })();











(() => {
  const fileInput  = document.getElementById('fileInput');
  const drop       = document.getElementById('drop');
  const convertBtn = document.getElementById('convert');
  const clearBtn   = document.getElementById('clear');
  const fileList   = document.getElementById('fileList');
  const count      = document.getElementById('count');
  const logEl      = document.getElementById('log');

  let files = [];

  // global collator for base-name comparison
  const collator = new Intl.Collator(undefined, {
    numeric: false,
    sensitivity: 'base'
  });

  // ---------- FIXED HEADERS FOR PROFILE FILES ----------
  const PROFILE_HEADERS = [
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

  // ---------- FIXED HEADERS FOR COMPANY FILES ----------
  const COMPANY_HEADERS = [
    "companyURL",
    "name",
    "category",
    "city",
    "stateOrProvince",
    "country",
    "followersCount",
    "employeesCount",
    "mutualConnections",
    "mutualConnectionsCount",
    "overview",
    "websiteUrl",
    "verifiedPage",
    "associatedMembersCount",
    "specialties"
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
      const profileRows = [];
      const companyRows = [];

      for (const f of files) {
        const obj = await readJsonFile(f);

        if (isCompanyJson(obj, f.name)) {
          companyRows.push(mapCompanyRow(obj));
        } else {
          profileRows.push(mapProfileRow(obj));
        }
      }

      if (profileRows.length) {
        const csvProfiles = rowsToCsv(profileRows, PROFILE_HEADERS);
        triggerDownload(csvProfiles, 'profiles.csv');
      }

      if (companyRows.length) {
        const csvCompanies = rowsToCsv(companyRows, COMPANY_HEADERS);
        triggerDownload(csvCompanies, 'companies.csv');
      }

      logMsg(
        `Done. ${profileRows.length} profile row(s), ${companyRows.length} company row(s).`
      );
    } catch (err) {
      console.error(err);
      logMsg('Error: ' + (err && err.message ? err.message : String(err)));
    }
  });

  // ---------- Helpers: file adding & sorting ----------

  function addFiles(listLike) {
    for (const f of listLike) {
      if (f.name.toLowerCase().endsWith('.json')) files.push(f);
    }

    // Sort so base file comes first, then numbered variants:
    // example: company_data.json, company_data (1).json, company_data (2).json ...
    files.sort((a, b) => compareFileNames(a.name, b.name));

    updateUI();
  }

  function compareFileNames(aName, bName) {
    const pa = parseName(aName);
    const pb = parseName(bName);

    const baseCmp = collator.compare(pa.base, pb.base);
    if (baseCmp !== 0) return baseCmp;

    // same base name → compare numeric suffix (0 for no suffix)
    if (pa.num !== pb.num) return pa.num - pb.num;

    // fallback to full name compare (stable)
    return collator.compare(aName, bName);
  }

  function parseName(name) {
    // e.g. "company_data (3).json" → base="company_data", num=3
    //      "company_data.json"     → base="company_data", num=0
    const m = name.match(/^(.*?)(?:\s*\((\d+)\))?(?:\.[^.]+)?$/);
    let base = name.toLowerCase();
    let num = 0;

    if (m) {
      base = m[1].trim().toLowerCase();
      if (m[2]) num = parseInt(m[2], 10) || 0;
    }
    return { base, num };
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

  // ---------- Type detection: profile vs company ----------

  function isCompanyJson(obj, filename) {
    const name = (filename || '').toLowerCase();
    if (name.includes('company_data') || name.includes('company')) return true;

    if (obj && typeof obj === 'object') {
      if ('companyURL' in obj) return true;
      if ('websiteUrl' in obj && !('profileURL' in obj)) return true;
    }

    return false;
  }

  // ---------- Mapping: PROFILE JSON → fixed row ----------

  function mapProfileRow(obj) {
    const row = {};
    const contact = obj && obj.contact ? obj.contact : {};

    for (const h of PROFILE_HEADERS) {
      let value = "";

      if (h.startsWith("contact.")) {
        const key = h.substring("contact.".length); // e.g. "website1"
        value = contact[key];
      } else if (h === "mutualConnectionsCount") {
        value = extractMutualCount(obj?.mutualConnections);
      } else if (h === "city" || h === "country") {
        if (obj.city || obj.country) {
          value = h === "city" ? obj.city : obj.country;
        } else {
          const location = obj?.location || "";
          const parts = location.split(',').map(p => p.trim()).filter(Boolean);
          if (h === "city") {
            value = parts[0] || "";
          } else {
            value = parts.length ? parts[parts.length - 1] : "";
          }
        }
      } else {
        value = obj[h];
      }

      row[h] = toCell(value);
    }

    return row;
  }

  // ---------- Mapping: COMPANY JSON → fixed row ----------

  function mapCompanyRow(obj) {
    const row = {};
    for (const h of COMPANY_HEADERS) {
      row[h] = toCell(obj && obj[h]);
    }
    return row;
  }

  // ---------- Small utilities ----------

  function toCell(v) {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v)) {
      return v
        .map(x => (x == null ? "" : String(x)))
        .filter(x => x !== "")
        .join("\n");
    }
    return String(v);
  }

  function extractMutualCount(text) {
    const m = /\b(\d{1,5})\b(?=\s+other\s+mutual\s+connections)/i.exec(text || "");
    return m ? m[1] : "";
  }

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
    return lines.join('\r\n'); // CRLF for Excel
  }

  function triggerDownload(csvText, filename) {
    const bom  = '\uFEFF';
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
