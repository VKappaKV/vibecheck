# vibecheck-contracts

Algorand TypeScript (PuyaTs) smart contract project for Vibecheck trust profiles.

## What the contract stores

Each account can initialize a profile and maintain three trust lists:

- Trusted APP ids (`uint64[]`)
- Trusted ASA ids (`uint64[]`)
- Trusted peer addresses (`address[]`)

State is stored in box maps keyed by account address.

## Important paths

- Contract source: `smart_contracts/vibecheck/contract.algo.ts`
- Deployment config: `smart_contracts/vibecheck/deploy-config.ts`
- Generated client artifact: `smart_contracts/artifacts/vibecheck/VibecheckClient.ts`
- Contract tests: `smart_contracts/vibecheck/contract.e2e.spec.ts`
- Utility SDK/demo scripts: `utils/vibecheckSdk.ts`, `utils/demo.ts`

## ABI surface

Initialization:

- `init(pay payMbr)void` initializes sender profile and funds required box MBR.

Add trust edges:

- `addTrustedApps(uint64[] apps)void`
- `addTrustedAsas(uint64[] assets)void`
- `addTrustedPeers(address[] peers)void`

Remove trust edges:

- `removeApp(uint64 app)void`
- `removeAsa(uint64 asset)void`
- `removePeer(address peer)void`

Read methods:

- `getTrustedApp(address account)uint64[]`
- `getTrustedASA(address account)uint64[]`
- `getAdjacencyList(address account)address[]`

## Prerequisites

- Node.js `22+`
- npm `9+`
- AlgoKit CLI `2.6+`
- Docker (only for LocalNet)

## Local development

From `projects/vibecheck-contracts`:

```bash
algokit project bootstrap all
algokit generate env-file -a target_network localnet
algokit localnet start
algokit project run build
algokit project run test
algokit project deploy localnet
```

Deployment logs include the deployed app id, for example:

`Initialized Vibecheck (<APP_ID>) ...`

## TestNet deployment

1. Generate network env file:

```bash
algokit generate env-file -a target_network testnet
```

2. Create `projects/vibecheck-contracts/.env.testnet` with:

- `DEPLOYER_MNEMONIC="..."` (creator account)
- `DISPENSER_MNEMONIC="..."` (funding account)

3. Build and deploy:

```bash
algokit project run build
algokit project deploy testnet
```

## NPM scripts

- `npm run build` compiles contracts and regenerates clients in `smart_contracts/artifacts`
- `npm run test` runs Vitest tests
- `npm run demo` runs `utils/demo.ts`
- `npm run lint` / `npm run lint:fix` checks contract code style
- `npm run check-types` runs TypeScript checks

## Frontend handoff

After deployment, set the same deployed app id in frontend env:

- `projects/vibecheck-frontend/.env`
- `VITE_VIBECHECK_APP_ID=<DEPLOYED_APP_ID>`
