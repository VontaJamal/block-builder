# Block Builder

A playful Three.js voxel builder for choosing a structure, entering an approximate block count, and watching it assemble block by block.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/?watch-build=1
```

Do not open `index.html` directly from Finder or Chrome. That file is the Vite source entry and needs the local dev server to load Three.js, styles, and generated assets.

## Verify

```bash
npm test
```
