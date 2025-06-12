let lastScanResult = null;

document.addEventListener("DOMContentLoaded", () => {

  const urlEl = document.getElementById("current-url");
  //Current URL
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    urlEl.innerText = tabs[0]?.url || "Unknown URL";
  });

  const scanBtn = document.getElementById("scan-now");
  const vuList = document.getElementById("vulnerability-list");
  const onoffBtn = document.getElementById("onoff");
 
  // Update the power button appearance
  function setOnOffUI(enabled) {
    if (enabled) {
      onoffBtn.classList.remove("off");
      onoffBtn.title = "Real-time scanning: ON";
    } else {
      onoffBtn.classList.add("off");
      onoffBtn.title = "Real-time scanning: OFF";
    }
  }

  // Load realtimeEnabled setting (default = true)
  chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
    setOnOffUI(realtimeEnabled);
  });

  // Toggle on/off when the user clicks the button
  onoffBtn.addEventListener("click", () => {
    chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
      const next = !realtimeEnabled;
      chrome.storage.local.set({ realtimeEnabled: next }, () => {
        setOnOffUI(next);
      });
    });
  });

   // Load and render the last auto-scan result 
  chrome.storage.local.get("lastScanResult", ({ lastScanResult: stored }) => {
    if (stored) {
      lastScanResult = stored;
      renderResults(stored);
    } else {
      // optional placeholder if nothing’s been scanned yet
      vuList.innerHTML = "<li>No scan data yet.</li>";
    }
  });

  //Manual Scan Button
  scanBtn.addEventListener("click", () => {
    scanBtn.classList.add("shrinking");
    vuList.innerHTML = "";

     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "runScan" },
        (response) => {
          scanBtn.classList.remove("shrinking");

          if (!response) {
            vuList.textContent = "No response from content script.";
            return;
          }

          if (response.error) {
            const li = document.createElement("li");
            li.textContent = `Scan error: ${response.error}`;
            vuList.appendChild(li);
            return;
          }

          lastScanResult = response;
          chrome.storage.local.set({ lastScanResult: response });
          renderResults(response);
        }
      );
    });
  });
 
  //Render Scan results (auto/manual)
  function renderResults(response) {
    vuList.innerHTML = "";
    let foundAny = false;
    //JS
    if (response.libraries?.length) {
      const li = document.createElement("li");
      li.textContent = "JS Vulnerability detected ";
      const btn = document.createElement("button");
      btn.textContent = "Details";
      btn.className = "detail-btn";
      btn.addEventListener("click", () => showDetails("libraries"));
      li.appendChild(btn);
      vuList.appendChild(li);
      foundAny = true;
    }
    //Xss
    if (response.xss?.length) {
      const li = document.createElement("li");
      li.textContent = "XSS patterns detected ";
      const btn = document.createElement("button");
      btn.textContent = "Details";
      btn.className = "detail-btn";
      btn.addEventListener("click", () => showDetails("xss"));
      li.appendChild(btn);
      vuList.appendChild(li);
      foundAny = true;
    }

    if (!foundAny) {
      const li = document.createElement("li");
      li.textContent = "No issues detected.";
      vuList.appendChild(li);
    }
  }

  //Details for the vuln to show up in middle, refer to detail_modal.js in content
  function showDetails(type) {
  if (!lastScanResult) return;
  const items = lastScanResult[type] || [];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "showDetails",
      dataType: type,
      data: items
    });
  });
}


  //Settings
  document.getElementById("setting").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("setting.html") });
  });
});


