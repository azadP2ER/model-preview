# model-preview

View glTF/GLB 3D models in the browser using [model-viewer](https://modelviewer.dev/), hosted on GitHub Pages.

Built with React + Vite.

## Usage

### Add a model
Put `.glb` or `.gltf` files in the `models/` directory and add entries to `public/models.json`:

```json
[
  { "name": "My Model", "url": "./models/my-model.glb" },
  { "name": "Duck", "url": "https://modelviewer.dev/shared-assets/models/Duck.glb" }
]
```

Models appear in the dropdown for quick selection. The first model loads by default. Remote URLs and local files both work.

### Environments
Add HDR entries to `public/environments.json`:
```json
[
  { "name": "Outdoor", "url": "https://example.com/sky.hdr" },
  { "name": "Neutral", "url": null }
]
```
The first entry is the default environment. Set `"url": null` for neutral lighting. If the HDR fails to load, it falls back to neutral.

### Drag & drop
Drag a `.glb`/`.gltf` file to preview a model, or an `.hdr` file to use as the environment.

### URL loading
Type any publicly accessible URL into the text field and click **Load**.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview production build
```

## GitHub Pages setup

1. Enable **GitHub Pages** in your repo settings (Settings → Pages → Source: **GitHub Actions**)
2. Push to `main` — the included workflow deploys `dist/` automatically

Or manually: set Pages source to branch `main`, folder `/ (root)` and run `npm run build` then push the `dist/` folder.

## Project structure

```
.
├── index.html          # Vite entry point
├── vite.config.js      # Vite config (base: /model-preview/)
├── package.json
├── src/
│   ├── main.jsx        # React root
│   └── App.jsx         # Model viewer component
├── models/             # Put .glb/.gltf files here
└── README.md
```
