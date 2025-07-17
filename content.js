/**
 * Content script for Image Zoomer & Downloader extension
 * Handles image zooming, preview, and download functionality
 */

// Global variables
let settings = {
  enabled: true,
  zoomLevel: 2,
  fileFormat: 'jpg',
  previewPosition: 'right',
  darkMode: false,
  blacklistedDomains: [],
  whitelistedDomains: [],
  filenameTemplate: 'auto'
};

let zoomContainer = null;
let downloadButton = null;
let infoTooltip = null;
let currentImage = null;

// Initialize the extension
function init() {
  // Load settings from storage
  chrome.storage.sync.get('zoomSettings', (data) => {
    if (data.zoomSettings) {
      settings = data.zoomSettings;
    }
    
    // Check if current domain is blacklisted
    const currentDomain = window.location.hostname;
    if (settings.blacklistedDomains.includes(currentDomain)) {
      return; // Don't initialize on blacklisted domains
    }
    
    // Check if whitelist is active and current domain is not in it
    if (settings.whitelistedDomains.length > 0 && !settings.whitelistedDomains.includes(currentDomain)) {
      return; // Don't initialize if not in whitelist
    }
    
    // Only initialize if enabled
    if (settings.enabled) {
      setupZoomElements();
      addEventListeners();
    }
  });
}

// Create and setup zoom elements
function setupZoomElements() {
  // Create zoom container
  zoomContainer = document.createElement('div');
  zoomContainer.className = 'image-zoomer-container';
  zoomContainer.style.display = 'none';
  
  // Create download button
  downloadButton = document.createElement('button');
  downloadButton.className = 'image-zoomer-download-btn';
  downloadButton.textContent = 'Download';
  downloadButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent event bubbling
    handleDownloadClick();
  });
  
  // Create info tooltip
  infoTooltip = document.createElement('div');
  infoTooltip.className = 'image-zoomer-tooltip';
  
  // Append elements
  zoomContainer.appendChild(downloadButton);
  zoomContainer.appendChild(infoTooltip);
  document.body.appendChild(zoomContainer);
  
  // Add event listeners to prevent zoom container from closing when hovering over it
  zoomContainer.addEventListener('mouseenter', function(e) {
    // Keep the container visible when mouse enters it
    if (currentImage) {
      zoomContainer.style.display = 'block';
    }
  });
  
  // Add event listener for when mouse leaves the zoom container
  zoomContainer.addEventListener('mouseleave', function(e) {
    // Check if the mouse is moving back to the current image
    if (e.relatedTarget === currentImage) {
      // Don't hide if moving back to the image
      return;
    }
    
    // Hide the container when mouse leaves it (unless going back to the image)
    zoomContainer.style.display = 'none';
    currentImage = null;
  });
  
  // Apply dark mode if enabled
  if (settings.darkMode) {
    zoomContainer.classList.add('dark-mode');
  }
}

// Add event listeners to images
function addEventListeners() {
  // Find all images on the page
  const images = document.querySelectorAll('img');
  
  // Add mouse events to each image
  images.forEach(img => {
    img.addEventListener('mouseenter', handleImageHover);
    img.addEventListener('mouseleave', handleImageLeave);
    img.addEventListener('mousemove', handleImageMouseMove);
  });
  
  // Add mutation observer to detect dynamically added images
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is an image or contains images
          if (node.nodeName === 'IMG') {
            node.addEventListener('mouseenter', handleImageHover);
            node.addEventListener('mouseleave', handleImageLeave);
            node.addEventListener('mousemove', handleImageMouseMove);
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll('img');
            images.forEach(img => {
              img.addEventListener('mouseenter', handleImageHover);
              img.addEventListener('mouseleave', handleImageLeave);
              img.addEventListener('mousemove', handleImageMouseMove);
            });
          }
        });
      }
    });
  });
  
  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for keyboard shortcut (Alt+Z)
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'z') {
      settings.enabled = !settings.enabled;
      // Update storage
      chrome.storage.sync.get('zoomSettings', (data) => {
        const updatedSettings = { ...data.zoomSettings, enabled: settings.enabled };
        chrome.storage.sync.set({ zoomSettings: updatedSettings });
      });
      
      // Hide zoom container if disabling
      if (!settings.enabled && zoomContainer) {
        zoomContainer.style.display = 'none';
      }
    }
  });
}

// Handle image hover
function handleImageHover(e) {
  if (!settings.enabled) return;
  
  currentImage = e.target;
  
  // Show zoom container
  zoomContainer.style.display = 'block';
  
  // Position the zoom container based on settings
  positionZoomContainer(e);
  
  // Set the zoomed image
  updateZoomedImage(currentImage);
  
  // Update image info tooltip
  updateImageInfo(currentImage);
}

// Handle image mouse leave
function handleImageLeave(e) {
  // Check if the mouse is moving to the zoom container
  // by checking if the relatedTarget (element mouse is moving to) is the zoom container or a child of it
  if (e.relatedTarget === zoomContainer || 
      (e.relatedTarget && zoomContainer.contains(e.relatedTarget))) {
    // Don't hide the container or reset currentImage if moving to the zoom container
    return;
  }
  
  if (zoomContainer) {
    zoomContainer.style.display = 'none';
  }
  currentImage = null;
}

// Handle mouse movement over image
function handleImageMouseMove(e) {
  if (!settings.enabled || !currentImage) return;
  
  // Update zoom container position
  positionZoomContainer(e);
  
  // Update zoomed image position
  updateZoomedImagePosition(e);
}

// Position the zoom container based on settings and mouse position
function positionZoomContainer(e) {
  const rect = currentImage.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Set container size based on original image, but make it larger to show the full image
  const containerWidth = Math.min(Math.max(rect.width * 2, 300), 600); // Between 300-600px
  const containerHeight = Math.min(Math.max(rect.height * 2, 300), 600); // Between 300-600px
  
  zoomContainer.style.width = `${containerWidth}px`;
  zoomContainer.style.height = `${containerHeight}px`;
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate positions for each option
  let leftPos, topPos;
  
  // Position based on settings
  switch (settings.previewPosition) {
    case 'right':
      leftPos = rect.right + scrollLeft + 10;
      // Check if container would go off the right edge of the viewport
      if (leftPos + containerWidth > viewportWidth) {
        // If it would go off-screen, position it to the left of the image instead
        leftPos = rect.left + scrollLeft - containerWidth - 10;
      }
      topPos = rect.top + scrollTop;
      break;
    case 'left':
      leftPos = rect.left + scrollLeft - containerWidth - 10;
      // Check if container would go off the left edge of the viewport
      if (leftPos < 0) {
        // If it would go off-screen, position it to the right of the image instead
        leftPos = rect.right + scrollLeft + 10;
      }
      topPos = rect.top + scrollTop;
      break;
    case 'top':
      leftPos = rect.left + scrollLeft;
      topPos = rect.top + scrollTop - containerHeight - 10;
      // Check if container would go off the top edge of the viewport
      if (topPos < 0) {
        // If it would go off-screen, position it below the image instead
        topPos = rect.bottom + scrollTop + 10;
      }
      break;
    case 'bottom':
      leftPos = rect.left + scrollLeft;
      topPos = rect.bottom + scrollTop + 10;
      // Check if container would go off the bottom edge of the viewport
      if (topPos + containerHeight > viewportHeight) {
        // If it would go off-screen, position it above the image instead
        topPos = rect.top + scrollTop - containerHeight - 10;
      }
      break;
    default:
      // Default to right
      leftPos = rect.right + scrollLeft + 10;
      // Check if container would go off the right edge of the viewport
      if (leftPos + containerWidth > viewportWidth) {
        // If it would go off-screen, position it to the left of the image instead
        leftPos = rect.left + scrollLeft - containerWidth - 10;
      }
      topPos = rect.top + scrollTop;
  }
  
  // Apply the calculated positions
  zoomContainer.style.left = `${leftPos}px`;
  zoomContainer.style.top = `${topPos}px`;
}

// Update the zoomed image
function updateZoomedImage(img) {
  // Remove any existing zoomed image
  const existingImg = zoomContainer.querySelector('.zoomed-image');
  if (existingImg) {
    zoomContainer.removeChild(existingImg);
  }
  
  // Create new zoomed image
  const zoomedImg = document.createElement('div');
  zoomedImg.className = 'zoomed-image';
  zoomedImg.style.backgroundImage = `url(${img.src})`;
  
  // Use contain mode to ensure the entire image is visible
  // The !important in CSS will override this, but we set it here for consistency
  zoomedImg.style.backgroundSize = 'contain';
  zoomedImg.style.backgroundRepeat = 'no-repeat';
  
  // Insert before other elements
  zoomContainer.insertBefore(zoomedImg, zoomContainer.firstChild);
}

// Update zoomed image position based on mouse position
function updateZoomedImagePosition(e) {
  const zoomedImg = zoomContainer.querySelector('.zoomed-image');
  if (!zoomedImg || !currentImage) return;
  
  const rect = currentImage.getBoundingClientRect();
  
  // Calculate mouse position relative to image
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  
  // For contain mode, we need to adjust the background position differently
  // to ensure the entire image is visible
  if (settings.zoomLevel <= 1) {
    // If zoom level is low, just center the image
    zoomedImg.style.backgroundPosition = 'center';
  } else {
    // For higher zoom levels, follow the mouse position
    zoomedImg.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
  }
}

// Update image info tooltip
function updateImageInfo(img) {
  if (!infoTooltip) return;
  
  // Get image dimensions
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  
  // Get image format from URL or fallback
  let format = 'unknown';
  if (img.src) {
    const urlParts = img.src.split('.');
    if (urlParts.length > 1) {
      format = urlParts[urlParts.length - 1].split(/\#|\?/)[0].toLowerCase();
    }
  }
  
  // Get file size if available (not always possible due to browser security)
  let fileSize = 'unknown';
  
  // Update tooltip content
  infoTooltip.textContent = `${width}×${height} | ${format.toUpperCase()}`;
  
  // Try to get file size (this may not work for cross-origin images)
  fetch(img.src, { method: 'HEAD' })
    .then(response => {
      const size = response.headers.get('content-length');
      if (size) {
        const sizeInKB = Math.round(size / 1024);
        infoTooltip.textContent = `${width}×${height} | ${sizeInKB} KB | ${format.toUpperCase()}`;
      }
    })
    .catch(() => {
      // Silently fail - keep the existing tooltip
    });
}

// Handle download button click
function handleDownloadClick() {
  if (!currentImage) return;
  
  downloadImage(currentImage.src);
}

// Download image with specified format
function downloadImage(imageUrl) {
  // Generate filename based on settings
  const filename = generateFilename(imageUrl, currentImage);
  
  // If the requested format is the same as the image format, download directly
  if (imageUrl.toLowerCase().endsWith(`.${settings.fileFormat}`)) {
    chrome.runtime.sendMessage({
      action: 'downloadImage',
      imageUrl: imageUrl,
      filename: filename
    });
    return;
  }
  
  // Otherwise, convert the image to the desired format
  convertImageFormat(imageUrl, settings.fileFormat, filename);
}

// Convert image to specified format
function convertImageFormat(imageUrl, format, filename) {
  // Create an image element to load the image
  const img = new Image();
  img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
  
  img.onload = function() {
    // Create canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image on canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Convert to desired format
    let mimeType;
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }
    
    // Get data URL
    const dataUrl = canvas.toDataURL(mimeType, 0.9);
    
    // Send to background script for download
    chrome.runtime.sendMessage({
      action: 'downloadImage',
      imageUrl: dataUrl,
      filename: filename
    });
  };
  
  img.onerror = function() {
    // If conversion fails, try direct download
    chrome.runtime.sendMessage({
      action: 'downloadImage',
      imageUrl: imageUrl,
      filename: filename
    });
  };
  
  // Load the image
  img.src = imageUrl;
}

// Generate filename based on settings
function generateFilename(imageUrl, imgElement) {
  const format = settings.fileFormat;
  const date = new Date();
  const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
  
  let filename;
  
  switch (settings.filenameTemplate) {
    case 'date':
      filename = `image_${timestamp}.${format}`;
      break;
    case 'alt-text':
      // Use alt text if available, otherwise fallback to auto
      if (imgElement && imgElement.alt && imgElement.alt.trim()) {
        // Clean alt text for filename
        const cleanAlt = imgElement.alt.trim().replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        filename = `${cleanAlt}.${format}`;
      } else {
        // Fallback to auto
        const urlParts = imageUrl.split('/');
        const originalFilename = urlParts[urlParts.length - 1].split(/\#|\?/)[0];
        filename = `${originalFilename.split('.')[0]}.${format}`;
      }
      break;
    case 'site-timestamp':
      const domain = window.location.hostname.replace(/^www\./, '');
      filename = `${domain}_${timestamp}.${format}`;
      break;
    case 'auto':
    default:
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1].split(/\#|\?/)[0];
      filename = `${originalFilename.split('.')[0]}.${format}`;
  }
  
  return filename;
}

// Batch download all images on the page
function batchDownloadImages() {
  // Find all images on the page
  const images = document.querySelectorAll('img');
  const imageList = [];
  
  // Filter images (exclude tiny icons, etc.)
  images.forEach(img => {
    if (img.naturalWidth > 100 && img.naturalHeight > 100) {
      imageList.push({
        url: img.src,
        alt: img.alt || ''
      });
    }
  });
  
  // Send to background script for batch download
  if (imageList.length > 0) {
    const domain = window.location.hostname.replace(/^www\./, '');
    const timestamp = new Date().toISOString().replace(/[\-\:]/g, '').split('.')[0];
    
    chrome.runtime.sendMessage({
      action: 'batchDownload',
      images: imageList,
      format: settings.fileFormat,
      zipName: `${domain}_${timestamp}`
    });
  }
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle ping from popup to check if content script is loaded
  if (request.action === 'ping') {
    sendResponse({ status: 'content_script_active' });
  }
  
  // Handle zoom toggle
  if (request.action === 'toggleZoom') {
    settings.enabled = !settings.enabled;
    
    // Update storage
    chrome.storage.sync.get('zoomSettings', (data) => {
      const updatedSettings = { ...data.zoomSettings, enabled: settings.enabled };
      chrome.storage.sync.set({ zoomSettings: updatedSettings });
    });
    
    // Hide zoom container if disabling
    if (!settings.enabled && zoomContainer) {
      zoomContainer.style.display = 'none';
    }
    
    sendResponse({ status: 'toggled', enabled: settings.enabled });
  }
  
  // Handle settings update
  if (request.action === 'updateSettings') {
    settings = request.settings;
    
    // Apply dark mode if changed
    if (zoomContainer) {
      if (settings.darkMode) {
        zoomContainer.classList.add('dark-mode');
      } else {
        zoomContainer.classList.remove('dark-mode');
      }
    }
    
    sendResponse({ status: 'settings_updated' });
  }
  
  // Handle zoom specific image (from context menu)
  if (request.action === 'zoomImage') {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src === request.imageUrl) {
        // Simulate hover
        currentImage = img;
        updateZoomedImage(img);
        updateImageInfo(img);
        
        // Position zoom container near the image
        const rect = img.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        zoomContainer.style.display = 'block';
        zoomContainer.style.left = `${rect.right + scrollLeft + 10}px`;
        zoomContainer.style.top = `${rect.top + scrollTop}px`;
      }
    });
    
    sendResponse({ status: 'zooming_image' });
  }
  
  // Handle download specific image (from context menu)
  if (request.action === 'downloadImage' && request.imageUrl) {
    downloadImage(request.imageUrl);
    sendResponse({ status: 'downloading_image' });
  }
  
  // Handle batch download request
  if (request.action === 'batchDownload') {
    batchDownloadImages();
    sendResponse({ status: 'batch_downloading' });
  }
  
  return true; // Keep the message channel open for async response
});

// Initialize the extension
init();