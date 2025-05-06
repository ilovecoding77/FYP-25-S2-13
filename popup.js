document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("score-value").innerText = "85";

  const vulns = ["XSS Detected", "Outdated Lib", "Weak CSP"];
  const list = document.getElementById("vulnerability-list");
  vulns.forEach(v => {
    const li = document.createElement("li");
    li.textContent = v;
    list.appendChild(li);
  });

  document.getElementById("setting").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("setting.html") });
  });
});
