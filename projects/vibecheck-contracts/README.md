# vibecheck-contracts

Algorand TypeScript smart contract project for the Vibecheck trust graph.

## What this contract does

Each account can initialize a trust profile and maintain three trust lists:

- Trusted App IDs (`uint64[]`)
- Trusted ASA IDs (`uint64[]`)
- Trusted peer addresses (`address[]`)

Lists are stored in box maps keyed by account address.

## Contract location

- Contract source: `smart_contracts/vibecheck/contract.algo.ts`
- Generated client: `smart_contracts/artifacts/vibecheck/VibecheckClient.ts`
- E2E tests: `smart_contracts/vibecheck/contract.e2e.spec.ts`
- SDK helpers: `utils/vibecheckSdk.ts`

## ABI methods

### Initialization

- `init(pay payMbr)void`
  - Creates empty lists for the sender.
  - Requires a payment transaction to fund the app account for box minimum balance.
  - Sender can initialize only once.

### Add trust edges

- `addTrustedApps(uint64[] apps)void`
  - Adds non-zero app IDs.
  - Ignores duplicates.
- `addTrustedAsas(uint64[] assets)void`
  - Adds non-zero asset IDs.
  - Ignores duplicates.
- `addTrustedPeers(address[] peers)void`
  - Adds non-zero peer addresses.
  - Ignores duplicates.

### Remove trust edges

- `removeApp(uint64 app)void`
  - Removes one app ID from sender profile.
- `removeAsa(uint64 asset)void`
  - Removes one asset ID from sender profile.
- `removePeer(address peer)void`
  - Removes one peer address from sender profile.

All remove methods are scoped to the transaction sender's profile.

### Read methods (readonly)

- `getTrustedApp(address account)uint64[]`
- `getTrustedASA(address account)uint64[]`
- `getAdjacencyList(address account)address[]`

If the account is not initialized, read methods return empty arrays.

## Local development

### Prerequisites

- Node.js 22+
- AlgoKit CLI 2.5+
- Docker (for LocalNet)
- Puya compiler 4.4.4+

### Setup

From `projects/vibecheck-contracts`:

```bash
algokit project bootstrap all
algokit generate env-file -a target_network localnet
algokit localnet start
```

## Common commands

- Build contract + regenerate typed client:

```bash
npm run build
```

- Run tests (unit + e2e):

```bash
npm run test
```

- Run demo script:

```bash
npm run demo
```

## Utility SDK quick usage

`utils/vibecheckSdk.ts` exposes helpers for deployment and profile operations.

```ts
await sdk.initProfile(client, sender)
await sdk.addTrust(client, { sender, appIds: [42n], assetIds: [31566704n], peers: [peer] })
await sdk.removeApp(client, { sender, appId: 42n })
await sdk.removeAsa(client, { sender, assetId: 31566704n })
await sdk.removePeer(client, { sender, peer })
```
