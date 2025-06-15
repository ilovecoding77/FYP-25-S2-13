let lastScanResult = null;

document.addEventListener("DOMContentLoaded", () => {
  // Handle dropdownMenu
  const menuButton = document.getElementById("menuButton");
  const dropdownMenu = document.getElementById("dropdownMenu");

  menuButton.addEventListener("click", () => {
    dropdownMenu.style.display = (dropdownMenu.style.display === "block") ? "none" : "block";
  });

  document.addEventListener("click", function(event) {
    if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = "none";
    }
  });

  // Handle dropdownMenu2
  const setting = document.getElementById("setting");
  const dropdownMenu2 = document.getElementById("dropdownMenu2");

  setting.addEventListener("click", () => {
    dropdownMenu2.style.display = (dropdownMenu2.style.display === "block") ? "none" : "block";
  });

  document.addEventListener("click", function(event) {
    if (!setting.contains(event.target) && !dropdownMenu2.contains(event.target)) {
      dropdownMenu2.style.display = "none";
    }
  });

  const appSetting = document.getElementById("appSetting");
  appSetting.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("setting.html") });
  });

    // Generate formatted current date
  function dateFormat(date) {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    // Handle ordinal suffix
    const rules = new Intl.PluralRules("en", { type: "ordinal" });
    const suffixes = { one: "st", two: "nd", few: "rd", other: "th" };
    const suffix = suffixes[rules.select(day)];

    return `${day}${suffix} ${month} ${year}`;
  }

  const currentDate = document.getElementById("current-date");
  const today = new Date();
  currentDate.innerText = dateFormat(today);

  const urlEl = document.getElementById("current-url");
  // Get current URL
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    urlEl.innerText = tabs[0]?.url || "Unknown URL";
  });

  const scanBtn = document.getElementById("scan-now");
  const vuList = document.getElementById("vulnerability-list");
  const onoffBtn = document.getElementById("onoff");
  const onoffBtn2 = document.getElementById("onoff2");

  // Unified toggle handler
  function toggleRealtime() {
    chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
      const next = !realtimeEnabled;
      chrome.storage.local.set({ realtimeEnabled: next }, () => {
        setOnOffUI(next);
      });
    });
  }

  // Add event listeners to both on/off buttons
  if (onoffBtn) {
    onoffBtn.addEventListener("click", toggleRealtime);
  }
  if (onoffBtn2) {
    onoffBtn2.addEventListener("click", toggleRealtime);
  }

  // Update UI based on realtimeEnabled value
  function setOnOffUI(enabled) {
    if (onoffBtn) {
      if (enabled) {
        onoffBtn.classList.remove("off");
        onoffBtn.title = "Real-time scanning: ON";
      } else {
        onoffBtn.classList.add("off");
        onoffBtn.title = "Real-time scanning: OFF";
      }
    }

    // Switch mode for entire page
    if (enabled) {
      document.body.classList.add("mode-on");
      document.body.classList.remove("mode-off");
    } else {
      document.body.classList.add("mode-off");
      document.body.classList.remove("mode-on");
    }
  }

  // Load saved realtimeEnabled on startup
  chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
    setOnOffUI(realtimeEnabled);
  });

  // Load and render previous scan results
  chrome.storage.local.get("lastScanResult", ({ lastScanResult: stored }) => {
    if (stored) {
      lastScanResult = stored;
      renderResults(stored);
    } else {
      vuList.innerHTML = "<li>No scan data yet.</li>";
    }
  });

  // Handle scan button click
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

  // Render scan results to UI
  function renderResults(response) {
    vuList.innerHTML = "";
    let foundAny = false;

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

  // Show details for vulnerabilities
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
});
