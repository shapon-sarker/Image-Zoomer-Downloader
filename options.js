/**
 * Options script for Image Zoomer & Downloader extension
 * Handles advanced settings like domain lists and filename options
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
  filenameTemplate: 'auto',
  loadOnDemand: false,
  showNotifications: true
};

// DOM elements
const domainListTypeSelect = document.getElementById('domainListType');
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomainBtn');
const domainList = document.getElementById('domainList');
const filenameTemplateSelect = document.getElementById('filenameTemplate');
const loadOnDemandCheckbox = document.getElementById('loadOnDemand');
const showNotificationsCheckbox = document.getElementById('showNotifications');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');

// Current settings
let currentSettings = { ...defaultSettings };
// Current domain list type (blacklist or whitelist)
let currentDomainListType = 'blacklist';

// Initialize options page
function initOptions() {
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
  // Determine which domain list to use
  currentDomainListType = currentSettings.whitelistedDomains.length > 0 ? 'whitelist' : 'blacklist';
  domainListTypeSelect.value = currentDomainListType;
  
  // Update domain list
  updateDomainList();
  
  // Update filename template
  filenameTemplateSelect.value = currentSettings.filenameTemplate;
  
  // Update checkboxes
  loadOnDemandCheckbox.checked = currentSettings.loadOnDemand || false;
  showNotificationsCheckbox.checked = currentSettings.showNotifications !== false; // Default to true
}

// Setup event listeners
function setupEventListeners() {
  // Domain list type select
  domainListTypeSelect.addEventListener('change', () => {
    currentDomainListType = domainListTypeSelect.value;
    updateDomainList();
  });
  
  // Add domain button
  addDomainBtn.addEventListener('click', addDomain);
  
  // Domain input enter key
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addDomain();
    }
  });
  
  // Filename template select
  filenameTemplateSelect.addEventListener('change', () => {
    currentSettings.filenameTemplate = filenameTemplateSelect.value;
  });
  
  // Load on demand checkbox
  loadOnDemandCheckbox.addEventListener('change', () => {
    currentSettings.loadOnDemand = loadOnDemandCheckbox.checked;
  });
  
  // Show notifications checkbox
  showNotificationsCheckbox.addEventListener('change', () => {
    currentSettings.showNotifications = showNotificationsCheckbox.checked;
  });
  
  // Reset button
  resetBtn.addEventListener('click', resetSettings);
  
  // Save button
  saveBtn.addEventListener('click', saveSettings);
}

// Update domain list UI
function updateDomainList() {
  // Clear current list
  domainList.innerHTML = '';
  
  // Get the appropriate domain list based on current type
  const domains = currentDomainListType === 'blacklist' 
    ? currentSettings.blacklistedDomains 
    : currentSettings.whitelistedDomains;
  
  // Add each domain to the list
  if (domains && domains.length > 0) {
    domains.forEach(domain => {
      const li = document.createElement('li');
      li.textContent = domain;
      
      // Add remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove domain';
      removeBtn.addEventListener('click', () => removeDomain(domain));
      
      li.appendChild(removeBtn);
      domainList.appendChild(li);
    });
  } else {
    // Show message if no domains
    const li = document.createElement('li');
    li.textContent = 'No domains added';
    li.style.fontStyle = 'italic';
    li.style.color = 'var(--secondary-color)';
    domainList.appendChild(li);
  }
}

// Add domain to list
function addDomain() {
  const domain = domainInput.value.trim().toLowerCase();
  
  // Validate domain
  if (!domain) {
    return;
  }
  
  // Simple domain validation
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(domain)) {
    alert('Please enter a valid domain (e.g., example.com)');
    return;
  }
  
  // Get the appropriate domain list based on current type
  const domainListKey = currentDomainListType === 'blacklist' 
    ? 'blacklistedDomains' 
    : 'whitelistedDomains';
  
  // Check if domain already exists
  if (currentSettings[domainListKey].includes(domain)) {
    alert('This domain is already in the list');
    return;
  }
  
  // Add domain to list
  currentSettings[domainListKey].push(domain);
  
  // If adding to whitelist, clear blacklist and vice versa
  if (currentDomainListType === 'whitelist') {
    currentSettings.blacklistedDomains = [];
  } else {
    currentSettings.whitelistedDomains = [];
  }
  
  // Update UI
  updateDomainList();
  
  // Clear input
  domainInput.value = '';
  domainInput.focus();
}

// Remove domain from list
function removeDomain(domain) {
  // Get the appropriate domain list based on current type
  const domainListKey = currentDomainListType === 'blacklist' 
    ? 'blacklistedDomains' 
    : 'whitelistedDomains';
  
  // Remove domain from list
  currentSettings[domainListKey] = currentSettings[domainListKey].filter(d => d !== domain);
  
  // Update UI
  updateDomainList();
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = { ...defaultSettings };
    updateUI();
    saveSettings();
  }
}

// Save settings to storage
function saveSettings() {
  chrome.storage.sync.set({ zoomSettings: currentSettings }, () => {
    // Show save confirmation
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.style.backgroundColor = 'var(--success-color)';
    
    // Reset button after a delay
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = '';
    }, 1500);
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
    currentSettings.darkMode = true;
    applyDarkMode(true);
  }
}

// Apply dark mode to options page
function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', initOptions);