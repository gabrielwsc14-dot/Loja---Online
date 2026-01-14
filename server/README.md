# BabyShop Sync Server

This lightweight server serves the existing static site and adds a small synchronization layer between the local browser `localStorage` DB (`lojaDB`) and the repository `database.json`.

Key points:
- **No change** is made to existing `.js` files on disk. The server injects a tiny client script into HTML responses at runtime to perform sync.
- Clients load `/api/db` and merge with `localStorage.lojaDB`. The merged DB is saved locally and posted back to the server at `/api/sync`.

How to run:

1. Install dependencies (from project root):

```bash
cd server
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the site at `http://localhost:3000/` (the server serves files from the project root).

Notes and limitations:
- Merge strategy is simple: server data is the base; any array items present locally but not on the server (by `id`) are appended to the server copy.
- The sync is optimistic: concurrent edits from different devices may need manual resolution for conflicts.
- If you want stronger consistency, consider adding timestamps and conflict-resolution rules.
