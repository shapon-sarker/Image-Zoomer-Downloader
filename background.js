/**
 * Background script for Image Zoomer & Downloader extension
 * Handles context menu creation, keyboard shortcuts, and messaging
 */

// Default settings for the extension
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

// Initialize extension settings
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.get('zoomSettings', (data) => {
    if (!data.zoomSettings) {
      chrome.storage.sync.set({ zoomSettings: defaultSettings });
    }
  });

  // Create context menu items
  chrome.contextMenus.create({
    id: 'zoom-image',
    title: 'Zoom this image',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'download-image',
    title: 'Download via Zoomer',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'zoom-image') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'zoomImage',
      imageUrl: info.srcUrl
    });
  } else if (info.menuItemId === 'download-image') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'downloadImage',
      imageUrl: info.srcUrl
    });
  }
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-zoom') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleZoom' });
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle download request from content script
  if (request.action === 'downloadImage') {
    chrome.downloads.download({
      url: request.imageUrl,
      filename: request.filename,
      saveAs: request.saveAs || false
    });
    sendResponse({ status: 'downloading' });
  }
  
  // Handle batch download request
  if (request.action === 'batchDownload') {
    // Create a zip file using the JSZip library (would be loaded in content script)
    // For now, we'll just download each image individually
    request.images.forEach((image, index) => {
      chrome.downloads.download({
        url: image.url,
        filename: `batch/${request.zipName || 'images'}_${index}.${request.format || 'jpg'}`,
        saveAs: index === 0 // Only prompt for the first download
      });
    });
    sendResponse({ status: 'batch_downloading' });
  }
  
  return true; // Keep the message channel open for async response
});