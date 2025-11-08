# Case Constructor MVP Manual Verification Guide

This repository contains a single-page prototype built with plain HTML, CSS, and vanilla JavaScript. To evaluate the drag-and-drop image uploader, block management tooling, and live preview experience, follow the steps below.

## Prerequisites

- A modern desktop browser (Chrome, Edge, Safari, or Firefox). The page does not require a build step or network access once the assets are available locally.
- Optional: a lightweight HTTP server such as `npx serve`, `python3 -m http.server`, or the Live Server extension in VS Code. Running through a server ensures image previews resolve correctly.

## Launching the Prototype

1. Clone or download the repository to your machine.
2. From the project root, launch the built-in server (choose one):
   - **Node:** `npm start` (runs `node server.js` on port `4173`).
   - **Python:** `python3 -m http.server 4173`.
   - **npx serve:** `npx serve .` (requires Node.js).
   - **IDE:** Use an IDE-integrated static server.
3. Visit the served URL in your browser (e.g., `http://localhost:4173/app.html`).
4. If you prefer to open the file directly without a server, double-click `app.html`. Drag-and-drop uploads continue to work, but some browsers block local file previews—use the server option if previews fail to render.

> ✅ Want to check the server script quickly? Run `node server.js --check` to ensure the runtime is available without starting the listener.

## Quick Functionality Walkthrough

### Project details
- Fill in the project name, type, and summary on the "Project info" panel.
- Confirm validation messages disappear once all required fields are populated.

### Managing blocks
- Use **Add block** to append a new section. Each block starts with placeholder text and disabled publish state until required data exists.
- Reorder blocks via the drag handle on the left (mouse or keyboard shortcuts as described in the tooltip).
- Remove a block with the trash button; the preview and publish state should update immediately.

### Uploading imagery
- Drag an image file (PNG, JPG/JPEG, or WebP) onto a block's dropzone, or activate the zone with Enter/Space to open the file picker.
- After a successful upload you should see:
  - A thumbnail preview.
  - File name and size metadata.
  - "Replace" and "Remove" controls.
- Drop an unsupported file type to trigger an inline error that clears automatically after dismissing.

### Autotext generation
- Press **Generate description** inside a block to create templated copy. The button becomes a spinner while generating and is disabled again until the text is edited or cleared.

### Theme and font settings
- Toggle light/dark themes and switch fonts from the right-hand sidebar. The live preview pane updates instantly.

### Publishing & share strip
- When all blocks contain required content (title, role, image) and project info is complete, the publish banner activates.
- Click **Publish case** to generate the mock permalink. The link, view counter, and copy/share buttons become active.
- Use **Copy link** to verify the URL is placed on your clipboard.

### Analytics counters (simulated)
- Open the share link in a new tab. Each visit increments the view counter in the banner.
- Use the copy/share buttons to increment the respective counters. The counts reset when you clear the session storage via the **Reset analytics** control in the header.

## Troubleshooting

- **Drag-and-drop not firing:** Ensure the browser tab is focused and the file type is supported. The dropzone shows an outline and instructional text when it receives a valid drag.
- **Image preview missing:** Serve the page over HTTP instead of the `file://` protocol.
- **Publication locked:** Hover the disabled publish button to see a tooltip listing the fields that still require content.

## Feedback

If you encounter unexpected behavior, capture console logs (DevTools → Console) and describe the actions leading to the issue. This will help reproduce and address the problem quickly.
