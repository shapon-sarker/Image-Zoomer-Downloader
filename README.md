# Image Zoomer & Downloader Chrome Extension

A modern Chrome extension that enables users to zoom any image on hover and download images in various formats.
<img width="427" height="248" alt="image" src="https://github.com/user-attachments/assets/d6bdac33-90a7-4c03-a0e9-af8bde188536" />

<img width="914" height="848" alt="image" src="https://github.com/user-attachments/assets/17adba0c-22fa-4097-be11-8a527463c283" />

<img width="281" height="464" alt="image" src="https://github.com/user-attachments/assets/a3f35a87-a8e4-417f-aada-ec028fb7bcb8" />


## Features

- **Image Zoom on Hover**: When hovering over any image, a zoomed-in preview appears beside or above the original image.
- **Zoom Level Control**: Adjust zoom level (1.5x to 5x) using a slider in the extension popup.
- **Download Button**: A floating download button on the zoomed image preview allows for quick downloads.
- **Image Info Tooltip**: Shows image dimensions, file size (when available), and format.
- **File Format Options**: Choose between JPG, PNG, and WebP formats for downloads.
- **Enable/Disable Toggle**: Turn the zoom effect on or off from the popup panel.
- **Keyboard Shortcut Support**: Press `Alt+Z` to toggle the zoom feature globally.
- **Batch Download Mode**: Download all images on the current page in one click.
- **Preview Position Options**: Choose where the zoom preview appears (right, left, top, bottom).
- **Dark Mode Friendly**: The zoom preview and UI adapt to both light and dark sites.
- **Right Click Support**: "Zoom this image" and "Download via Zoomer" options in the context menu.
- **Blacklist/Whitelist Domains**: Add websites where the extension will or will not work.
- **Custom Filename Options**: Set filename style – auto-name, date, alt-text, or site+timestamp.
- **Privacy Safe**: Works fully client-side with no data sent to external servers.

## Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link to be added when published)
2. Click "Add to Chrome"
3. Confirm by clicking "Add extension"

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension should now be installed and ready to use

## Usage

1. **Basic Usage**: Simply hover over any image on a webpage to see the zoomed preview
2. **Adjust Settings**: Click the extension icon in the toolbar to access settings
3. **Advanced Options**: Right-click the extension icon and select "Options" for more settings

### Keyboard Shortcuts

- Press `Alt+Z` to toggle the zoom functionality on/off

## Privacy

This extension operates entirely client-side and does not collect or transmit any user data. All functionality works locally in your browser.

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `background.js`: Handles context menus and keyboard shortcuts
- `content.js`: Injects zoom and download functionality into pages
- `popup.html/js/css`: UI for controlling settings
- `options.html/js/css`: Advanced settings interface
- `styles.css`: Styling for the zoom interface
- `icons/`: Extension icons

### Building from Source

1. Clone the repository
2. Make any desired modifications
3. Load the extension in developer mode as described in the installation section

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Developer

**Md. Shapon Sarker**

- [Facebook](https://www.facebook.com/md.shapan11)
- [GitHub](https://github.com/shapon-sarker/)
- [WhatsApp](https://wa.me/+8801616910136)
