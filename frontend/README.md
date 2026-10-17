# SenyasKo frontend

React + TypeScript + Vite, with Tailwind CSS configured through its Vite plugin.

## Development

Use a Node.js version supported by the installed Vite release (see `node_modules/vite/package.json`).
The initial setup used Node.js 25.8.1.

From this folder, run:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. On systems without PowerShell script restrictions, `npm` works in place of `npm.cmd`.

## Checks

```powershell
npm.cmd run lint
npm.cmd run build
```

`npm.cmd run preview` serves the production build locally after building.

## Current scope

- React and TypeScript application scaffold.
- Tailwind CSS integration and responsive starter screen.
- Product page title and description.

The starter is temporary. The supplied Figma design will guide the actual pages,
components, typography, colors, and responsive layouts.
Authentication, lesson content, camera assessment, and the backend are not implemented yet.

## Entry points

- `src/main.tsx`: React entry point.
- `src/App.tsx`: temporary starting screen.
- `src/index.css`: Tailwind import and base styles.
- `vite.config.ts`: React and Tailwind plugins.

Keep service credentials out of the frontend. Values exposed through Vite's
`VITE_` environment variables are public browser configuration.
