function showSiteModal(type, items) {
  // Remove existing modal
  const existing = document.getElementById('vuln-modal');
  if (existing) existing.remove();

  console.log('>> showDetails received', type, items);

  // Overlay backdrop
  const modal = document.createElement('div');
  modal.id = 'vuln-modal';
  Object.assign(modal.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: '9999', display: 'flex',
    justifyContent: 'center', alignItems: 'center'
  });

  // Content box
  const box = document.createElement('div');
  Object.assign(box.style, {
    background: 'white', color: 'black',
    maxWidth: '600px', width: '90%',
    maxHeight: '80vh', overflowY: 'auto',
    padding: '20px', borderRadius: '10px',
    fontFamily: 'sans-serif', fontSize: '14px', position: 'relative'
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-vuln-modal';
  closeBtn.textContent = '✖';
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '10px', right: '10px',
    background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer'
  });
  closeBtn.onclick = () => modal.remove();
  box.appendChild(closeBtn);

  // Header
  const header = document.createElement('h2');
  header.textContent = type === 'libraries'
    ? 'JS Library Vulnerabilities'
    : 'XSS Vulnerabilities';
  box.appendChild(header);

  // Escape helper
  const escapeHtml = str => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Populate items into box
  items.forEach(i => {
    const entry = document.createElement('div');
    entry.style.marginBottom = '12px';
    //JS
    if (type === 'libraries') {
      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(i.library)} v${escapeHtml(i.version)}</strong>`;
      entry.appendChild(title);

      const sev = document.createElement('div');
      sev.textContent = `Severity: ${i.severity.toUpperCase()}`;
      entry.appendChild(sev);

      const ul = document.createElement('ul');
      i.identifiers.forEach((sum, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(sum)}</strong><br>Suggestion: ${escapeHtml(i.suggestions[idx])}`;
        ul.appendChild(li);
      });
      entry.appendChild(ul);
    } else {//XSS
      const fields = [
        { label: 'Type:', value: i.type },
        { label: 'Tag:', value: i.tag },
        { label: 'Attribute:', value: i.attr },
        { label: 'Href:', value: i.href },
        { label: 'Value:', value: i.value }
      ];
      fields.forEach(f => {
        if (f.value) {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${f.label}</strong> ${escapeHtml(f.value)}`;
          entry.appendChild(div);
        }
      });

      if (i.snippet) {
        const snipLabel = document.createElement('div');
        snipLabel.innerHTML = '<strong>Script Snippet:</strong>';
        entry.appendChild(snipLabel);

        const pre = document.createElement('pre');
        Object.assign(pre.style, {
          background: '#f4f4f4', padding: '8px',
          borderRadius: '4px', whiteSpace: 'pre-wrap'
        });
        const code = document.createElement('code');
        code.textContent = i.snippet;
        pre.appendChild(code);
        entry.appendChild(pre);
      }

      const suggest = document.createElement('div');
      suggest.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
      entry.appendChild(suggest);
    }

    box.appendChild(entry);
  });

  modal.appendChild(box);
  document.body.appendChild(modal);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'showDetails') {
    showSiteModal(msg.dataType, msg.data);
    sendResponse({ status: 'shown' });
  }
});
