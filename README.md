# Author Studio

Author Studio is a local-first manuscript builder for long-form writers. It runs entirely in the browser, stores project data in IndexedDB, supports downloadable JSON backups, and exports browser-generated `DOCX`, `EPUB`, and `PDF` files aimed at ebook publishing workflows such as Reedsy Editor, Amazon KDP, and Draft2Digital.

## Features

- Project dashboard with local project creation, open, import, and delete
- Guided manuscript setup for metadata, front matter, parts, chapters, and end matter
- Rich chapter editor using TipTap with EPUB-safe formatting controls
- Drag-and-drop front matter ordering and chapter movement between parts
- Real-time word counts for chapters, parts, and the full manuscript
- Auto-generated table of contents and ebook-style preview mode
- Local image manager with thumbnail review and chapter usage visibility
- IndexedDB autosave plus downloadable JSON project backups
- Export validation checks for common EPUB safety issues
- Client-side `DOCX`, `EPUB`, and `PDF` export

## Stack

- React + Vite
- Tailwind CSS
- TipTap
- Zustand
- dnd-kit
- Dexie.js
- `docx`, `jsPDF`, `JSZip`

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The Vite config uses `base: "./"` so the generated site can be hosted from a GitHub Pages repository or project subpath without a server rewrite rule.

## GitHub Pages Deployment

1. Run `npm install`.
2. Run `npm run build`.
3. Publish the contents of `dist/` to GitHub Pages.
4. In GitHub repository settings, configure Pages to serve from the deployed branch or artifact.

If you prefer GitHub Actions, use a standard Vite static-site workflow that uploads the `dist/` directory.

## Data Storage

- Active projects are saved to IndexedDB in the browser.
- Authors can export a full project as JSON at any time.
- Imported JSON files restore the manuscript locally with no backend dependency.

## Future AI-Ready Architecture

V1 does not implement AI features. The app state is intentionally centered around a normalized manuscript model so future integrations can add drafting or editing services without restructuring the editor. Candidate future modules include:

- Outline generation
- Rewrite and tone suggestions
- Summarization
- Back-cover description generation
- Local-model or OpenAI powered assistants
