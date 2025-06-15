document.addEventListener("DOMContentLoaded", () => {
  const defaultSettings = {
    js: true,
    xss: true,
    csrf: true,
    csp: true,
    trackers: true
  };

  // Load settings or use defaults
  chrome.storage.local.get({ scannersEnabled: defaultSettings }, ({ scannersEnabled }) => {
    document.getElementById("toggle-js").checked = scannersEnabled.js;
    document.getElementById("toggle-xss").checked = scannersEnabled.xss;
    document.getElementById("toggle-csrf").checked = scannersEnabled.csrf;
    document.getElementById("toggle-csp").checked = scannersEnabled.csp;
    document.getElementById("toggle-trackers").checked = scannersEnabled.trackers;
  });

  // Save settings on button click
  document.getElementById("save-btn").addEventListener("click", () => {
    const updatedSettings = {
      js: document.getElementById("toggle-js").checked,
      xss: document.getElementById("toggle-xss").checked,
      csrf: document.getElementById("toggle-csrf").checked,
      csp: document.getElementById("toggle-csp").checked,
      trackers: document.getElementById("toggle-trackers").checked
    };

    chrome.storage.local.set({ scannersEnabled: updatedSettings }, () => {
      alert("Settings saved!");
    });
  });
});
