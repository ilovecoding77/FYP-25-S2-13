// XSSScanner.js
function runXSSScan() {
  //  Skip known “trusted” domains need to implement it for whitelist
  const skip = [
    'youtube.com',
    'www.youtube.com',
    'mail.google.com',
    'accounts.google.com'
  ];
  if (skip.includes(window.location.hostname)) {
    return Promise.resolve([]);
  }

  const issues = [];

  document.querySelectorAll('*').forEach(el => {
    //  Inline event handlers (onclick, onerror)
    for (const attr of el.attributes) {
      if (/^on\w+/.test(attr.name)) {
        issues.push({
          type: 'inline-event-handler',
          tag: el.tagName,
          tagName: el.tagName,
          attr: attr.name,
          value: attr.value,
          suggestion: 'Avoid inline JavaScript event handlers. Use addEventListener in external JS files.'
        });
      }
    }

    // javascript: URIs in links
    if (el.matches('a[href^="javascript:"]')) {
      issues.push({
        type: 'javascript-uri',
        tag: el.tagName,
        tagName: el.tagName,
        href: el.getAttribute('href'),
        suggestion: 'Avoid using `javascript:` URLs in links. Replace with safe URL or JS handler.'
      });
    }

    // Dangerous innerHTML usage
    if (el.innerHTML && el.innerHTML.includes('<script')) {
      issues.push({
        type: 'dangerous-innerHTML',
        tag: el.tagName,
        tagName: el.tagName,
        snippet: el.innerHTML.slice(0, 100),
        suggestion: 'Avoid assigning untrusted data to innerHTML. Use textContent or proper sanitization.'
      });
    }

    // Inline styles containing javascript:
    if (el.hasAttribute('style') && el.getAttribute('style').toLowerCase().includes('javascript:')) {
      issues.push({
        type: 'css-javascript',
        tag: el.tagName,
        tagName: el.tagName,
        value: el.getAttribute('style'),
        suggestion: 'Avoid using `javascript:` in style attributes.'
      });
    }

    // Iframe srcdoc with unsanitized content
    if (el.hasAttribute('srcdoc')) {
      issues.push({
        type: 'iframe-srcdoc',
        tag: el.tagName,
        tagName: el.tagName,
        suggestion: 'Avoid using srcdoc with unsanitized input. Use sandbox attributes.'
      });
    }

    // Inline <script> blocks
    if (el.tagName === 'SCRIPT' && el.innerHTML.trim()) {
      issues.push({
        type: 'inline-script',
        tag: el.tagName,
        tagName: el.tagName,
        snippet: el.innerHTML.slice(0, 100),
        suggestion: 'Avoid inline <script>. Use external scripts and enable CSP headers.'
      });
    }
  });

  return Promise.resolve(issues);
}

window.runXSSScan = runXSSScan;
