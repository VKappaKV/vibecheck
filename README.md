# Vibecheck

Vibecheck is an Algorand trust-intelligence demo. It combines an on-chain trust profile contract with a React app that computes explainable trust scores for APPs and ASAs.

## Monorepo structure

- `projects/vibecheck-contracts`: Algorand TypeScript (PuyaTs) smart contract project, deployment scripts, tests, and trust-scoring utilities.
- `projects/vibecheck-frontend`: React frontend with wallet connectivity, live profile loading, trust mutations, and score analysis UI.

## Prerequisites

- Node.js `22+`
- npm `9+`
- AlgoKit CLI `2.6+`
- Docker (only required for LocalNet workflows)

## Quick start (LocalNet)

1. Bootstrap the workspace:

```bash
algokit project bootstrap all
```

2. Build and deploy contracts on LocalNet:

```bash
cd projects/vibecheck-contracts
algokit generate env-file -a target_network localnet
algokit localnet start
algokit project run build
algokit project deploy localnet
```

3. Copy the deployed app id printed by deployment logs (for example: `Initialized Vibecheck (<APP_ID>) ...`).

4. Configure and run the frontend:

```bash
cd ../vibecheck-frontend
npm run dev
```

Set these values in `projects/vibecheck-frontend/.env` before launching:

- `VITE_ENVIRONMENT=local`
- `VITE_VIBECHECK_APP_ID=<APP_ID_FROM_DEPLOYMENT>`

## Deploy contracts to TestNet

From `projects/vibecheck-contracts`:

```bash
algokit generate env-file -a target_network testnet
algokit project run build
algokit project deploy testnet
```

Create `projects/vibecheck-contracts/.env.testnet` with at least:

- `DEPLOYER_MNEMONIC="..."`
- `DISPENSER_MNEMONIC="..."`

After deployment, set `VITE_VIBECHECK_APP_ID` in `projects/vibecheck-frontend/.env` to the deployed app id.

## Useful commands

- Build all workspace projects: `algokit project run build`
- Contract tests: `cd projects/vibecheck-contracts && algokit project run test`
- Frontend lint: `cd projects/vibecheck-frontend && npm run lint`
- Frontend production build: `cd projects/vibecheck-frontend && npm run build`

## Project docs

- Contracts: `projects/vibecheck-contracts/README.md`
- Frontend: `projects/vibecheck-frontend/README.md`
- Generated clients in frontend: `projects/vibecheck-frontend/src/contracts/README.md`
