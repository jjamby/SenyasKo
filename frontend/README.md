# SenyasKo frontend

React, TypeScript, and Vite frontend for the SenyasKo FSL learning app.

From `frontend`, install dependencies with `npm ci` and run `npm run dev`. Start the backend separately using [its instructions](../backend/README.md). Vite proxies `/api` to the local backend.

Run `npm run lint` and `npm run build` to check the frontend.

Signed-in learners can use accounts, exchange messages with other registered learners, save drafts, see unread message notifications, and save explored lessons. The demo remains available from the welcome page with sample content. Camera preview runs locally; sign recognition and corrective feedback remain future work.
