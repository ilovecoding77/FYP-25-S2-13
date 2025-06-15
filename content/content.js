// To merge the scanners + realtime etc

// Default scanner settings (all true)
const DEFAULT_SCANNERS = { js: true, xss: true, csrf: true, csp: true, trackers: true };

// Automatically run on page load
chrome.storage.local.get(
  { realtimeEnabled: true, scannersEnabled: DEFAULT_SCANNERS },
  ({ realtimeEnabled, scannersEnabled }) => {
    console.log('[VulnEye] real-time enabled?', realtimeEnabled);
    // If real-time scanning is enabled, run only the enabled scanners
    if (realtimeEnabled) {
      const scans = [];
      if (scannersEnabled.js) scans.push(window.runLibraryScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.xss) scans.push(window.runXSSScan());
      else scans.push(Promise.resolve([]));

      Promise.all(scans)
        .then(([libFindings, xssFindings]) => {
          console.log('[VulnEye] auto-scan results', libFindings, xssFindings);
          chrome.storage.local.set({
            lastScanResult: { libraries: libFindings, xss: xssFindings }
          });
        })
        .catch(err => {
          console.error('[VulnEye] auto-scan error', err);
        });
    }
  }
);

// On click run manual scan
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[VulnEye] message received in content.js', msg);
  if (msg.action !== 'runScan') return;

  // Load scanner toggles and run only the enabled scanners
  chrome.storage.local.get(
    { scannersEnabled: DEFAULT_SCANNERS },
    ({ scannersEnabled }) => {
      const scans = [];
      if (scannersEnabled.js) scans.push(window.runLibraryScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.xss) scans.push(window.runXSSScan());
      else scans.push(Promise.resolve([]));

      Promise.all(scans)
        .then(([libraryFindings, xssFindings]) => {
          console.log('[VulnEye] manual-scan results', libraryFindings, xssFindings);
          sendResponse({ libraries: libraryFindings, xss: xssFindings });
        })
        .catch(error => {
          console.error('Error running scanners:', error);
          sendResponse({ error: error.message });
        });
    }
  );

  // Keep the message channel open for sendResponse
  return true;
});
