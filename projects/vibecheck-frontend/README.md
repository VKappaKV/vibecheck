# vibecheck-frontend

React frontend for the Vibecheck trust graph demo.

## What this app does

- Connects Algorand wallets (`Pera`, `Lute`, and `KMD` on LocalNet)
- Loads trust profiles from the deployed Vibecheck smart contract
- Lets users initialize and mutate trust lists (peer, ASA, APP)
- Computes and displays explainable trust scores for APP and ASA targets
- Generates a peer invite link with QR modal sharing

## Key files

- App shell and routing: `src/App.tsx`
- Pages: `src/pages/HomePage.tsx`, `src/pages/DemoPage.tsx`
- Demo logic/hooks: `src/components/trust-demo/`
- Generated contract client: `src/contracts/Vibecheck.ts`

## Prerequisites

- Node.js `20+` (Node `22+` recommended for workspace consistency)
- npm `9+`
- AlgoKit CLI `2+` (used by `generate:app-clients`)

## Environment setup

Use `projects/vibecheck-frontend/.env.template` as reference and configure `projects/vibecheck-frontend/.env`.

Required values:

- `VITE_ENVIRONMENT` (`local`, `testnet`, or `production`)
- `VITE_VIBECHECK_APP_ID` (deployed contract app id used by demo page)
- Algod/indexer settings for your target network (`VITE_ALGOD_*`, `VITE_INDEXER_*`)

Notes:

- Default template is set to TestNet endpoints.
- LocalNet wallet support requires KMD env vars (`VITE_KMD_*`).

## Development

From `projects/vibecheck-frontend`:

```bash
npm install
npm run dev
```

`npm run dev` automatically links generated app clients via `algokit project link --all` before starting Vite.

## Commands

- `npm run dev`: link clients and start local dev server
- `npm run build`: link clients, type-check, and build production bundle
- `npm run lint`: run ESLint
- `npm run test`: run Jest tests
- `npm run playwright:test`: run Playwright browser tests
- `npm run preview`: preview production build

## Contract integration flow

1. Deploy/update contracts in `projects/vibecheck-contracts`.
2. In this frontend project, run `npm run generate:app-clients` (or `npm run dev` / `npm run build`, which already does it).
3. Update `VITE_VIBECHECK_APP_ID` to the deployed app id.
4. Run the app and open `/demo`.

For more details on generated clients, see `src/contracts/README.md`.
