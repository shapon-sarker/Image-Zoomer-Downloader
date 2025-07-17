/**
 * Popup script for Image Zoomer & Downloader extension
 * Handles UI interactions and settings management
 */

// Default settings
const defaultSettings = {
  enabled: true,
  zoomLevel: 2,
  fileFormat: 'jpg',
  previewPosition: 'right',
  darkMode: false,
  blacklistedDomains: [],
  whitelistedDomains: [],
  filenameTemplate: 'auto'
};

// DOM elements
const enableToggle = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const zoomLevelSlider = document.getElementById('zoomLevel');
const zoomLevelValue = document.getElementById('zoomLevelValue');
const fileFormatSelect = document.getElementById('fileFormat');
const previewPositionSelect = document.getElementById('previewPosition');
const darkModeToggle = document.getElementById('darkMode');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const optionsBtn = document.getElementById('optionsBtn');

// Current settings
let currentSettings = { ...defaultSettings };

// Initialize popup
function initPopup() {
  // Load settings from storage
  chrome.storage.sync.get('zoomSettings', (data) => {
    if (data.zoomSettings) {
      currentSettings = data.zoomSettings;
      updateUI();
    }
  });
  
  // Add event listeners
  setupEventListeners();
  
  // Check if we should use dark mode
  checkDarkMode();
}

// Update UI based on current settings
function updateUI() {
  // Update toggle
  enableToggle.checked = currentSettings.enabled;
  statusText.textContent = currentSettings.enabled ? 'Enabled' : 'Disabled';
  
  // Update zoom level
  zoomLevelSlider.value = currentSettings.zoomLevel;
  zoomLevelValue.textContent = `${currentSettings.zoomLevel}x`;
  
  // Update file format
  fileFormatSelect.value = currentSettings.fileFormat;
  
  // Update preview position
  previewPositionSelect.value = currentSettings.previewPosition;
  
  // Update dark mode toggle
  darkModeToggle.checked = currentSettings.darkMode;
}

// Setup event listeners
function setupEventListeners() {
  // Enable/disable toggle
  enableToggle.addEventListener('change', () => {
    currentSettings.enabled = enableToggle.checked;
    statusText.textContent = currentSettings.enabled ? 'Enabled' : 'Disabled';
    saveSettings();
  });
  
  // Zoom level slider
  zoomLevelSlider.addEventListener('input', () => {
    const value = parseFloat(zoomLevelSlider.value);
    currentSettings.zoomLevel = value;
    zoomLevelValue.textContent = `${value}x`;
    saveSettings();
  });
  
  // File format select
  fileFormatSelect.addEventListener('change', () => {
    currentSettings.fileFormat = fileFormatSelect.value;
    saveSettings();
  });
  
  // Preview position select
  previewPositionSelect.addEventListener('change', () => {
    currentSettings.previewPosition = previewPositionSelect.value;
    saveSettings();
  });
  
  // Dark mode toggle
  darkModeToggle.addEventListener('change', () => {
    currentSettings.darkMode = darkModeToggle.checked;
    applyDarkMode(currentSettings.darkMode);
    saveSettings();
  });
  
  // Batch download button
  batchDownloadBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        // Check if tab exists and has a valid ID
        if (tabs && tabs.length > 0 && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'batchDownload' }, (response) => {
            // Handle potential connection error
            if (chrome.runtime.lastError) {
              console.log('Connection error:', chrome.runtime.lastError.message);
              // You could show an error message to the user here
            }
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  });
  
  // Options button
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Save settings to storage
function saveSettings() {
  chrome.storage.sync.set({ zoomSettings: currentSettings }, () => {
    // Notify content script of settings change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: currentSettings
        }, (response) => {
          // Handle potential connection error
          if (chrome.runtime.lastError) {
            console.log('Connection error:', chrome.runtime.lastError.message);
            // This is expected if the content script isn't loaded on the current page
          }
        });
      }
    });
  });
}

// Check if we should use dark mode
function checkDarkMode() {
  // Check if user has set dark mode preference
  if (currentSettings.darkMode) {
    applyDarkMode(true);
    return;
  }
  
  // Check if browser is in dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkModeToggle.checked = true;
    currentSettings.darkMode = true;
    applyDarkMode(true);
    saveSettings();
  }
}

// Apply dark mode to popup
function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// Check if content script is loaded and handle connection
function checkContentScriptConnection() {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        // Send a ping message to check if content script is loaded
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { action: 'ping' }, 
          (response) => {
            // If there's an error, it means the content script isn't loaded
            if (chrome.runtime.lastError) {
              console.log('Content script not loaded:', chrome.runtime.lastError.message);
              // Show a message to the user that the extension isn't active on this page
              const statusElement = document.getElementById('statusText');
              if (statusElement) {
                statusElement.textContent = 'Not available on this page';
                statusElement.style.color = '#ff5555';
              }
              
              // Disable controls that require content script
              if (batchDownloadBtn) batchDownloadBtn.disabled = true;
            }
          }
        );
      }
    });
  } catch (error) {
    console.error('Error checking content script connection:', error);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPopup();
  // Check content script connection after a short delay
  setTimeout(checkContentScriptConnection, 100);
});