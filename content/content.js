//To merge the scanners + realtime etc

//automatically run on page load
// 1) Auto-scan on load if real-time is enabled
chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
  console.log('[VulnEye] real-time enabled?', realtimeEnabled);
  if (realtimeEnabled) {
    Promise.all([
      window.runLibraryScan(),
      window.runXSSScan()
    ])
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
});

  //On click run Scan
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[VulnEye] message received in content.js', msg);
  if (msg.action !== 'runScan') return;

  // Run the scanners in parallel currently only 2
  Promise.all([
    window.runLibraryScan(),
    window.runXSSScan()
  ])
    .then(([libraryFindings, xssFindings]) => { 
      console.log('[VulnEye] manual-scan results', libraryFindings, xssFindings);
      sendResponse({
        libraries: libraryFindings,
        xss: xssFindings
      });
    })
    .catch(error => {
      console.error('Error running scanners:', error);
      sendResponse({ error: error.message });
    });
  return true;
}
);
