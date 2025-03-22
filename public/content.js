// content-script.js

// Inject JavaScript into the page's DOM
async function injectScript(filePath) {
  console.log(filePath)
  try {
    const response = await fetch(chrome.runtime.getURL(filePath));
    const scriptContent = await response.text();
    const script = document.createElement("script");
    script.id = `linkagent-${filePath.split('/').pop().replace('.', '-')}`; // e.g., linkagent-anime-js
    script.textContent = scriptContent;
    document.head.appendChild(script);
    console.log(`[Content] Injected JS with ID: ${script.id}`);
  } catch (error) {
    console.error(`[Content] Failed to inject JS ${filePath}:`, error);
  }
}

// Inject CSS into the page's DOM
async function injectCSS(filePath) {
  try {
    const response = await fetch(chrome.runtime.getURL(filePath));
    const cssContent = await response.text();
    const style = document.createElement("style");
    style.id = `linkagent-${filePath.split('/').pop().replace('.', '-')}`; // e.g., linkagent-anime-css
    style.textContent = cssContent;
    document.head.appendChild(style);
    console.log(`[Content] Injected CSS with ID: ${style.id}`);
  } catch (error) {
    console.error(`[Content] Failed to inject CSS ${filePath}:`, error);
  }
}

// Initialize libraries
async function initialize() {
  // Inject libraries into the page
  await injectScript("libraries/anime.js");
  await injectScript("libraries/tailwind.js");
  await injectCSS("libraries/anime.css"); // Assuming this is Animate.css
}

initialize().catch((error) => {
  console.error("[Content] Initialization failed:", error);
});