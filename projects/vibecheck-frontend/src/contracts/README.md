## Generated contract clients

This folder contains generated TypeScript clients used by the frontend to call deployed Algorand applications.

Current Vibecheck client:

- `Vibecheck.ts`

Do not edit generated client files manually. Regenerate them from the contract project instead.

## Regenerate clients

From `projects/vibecheck-frontend`:

```bash
npm run generate:app-clients
```

This runs `algokit project link --all`, which reads app specs from workspace contract projects and writes fresh clients into this folder.

## Typical usage in frontend code

```ts
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { VibecheckFactory } from '../contracts/Vibecheck'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const algorand = AlgorandClient.fromConfig({
  algodConfig: getAlgodConfigFromViteEnvironment(),
  indexerConfig: getIndexerConfigFromViteEnvironment(),
})
const factory = new VibecheckFactory({ algorand, defaultSender: activeAddress })
const appClient = factory.getAppClientById({ appId: BigInt(import.meta.env.VITE_VIBECHECK_APP_ID) })
```

See `src/components/trust-demo/useTrustDemoData.ts` and `src/components/trust-demo/useTrustProfileMutations.ts` for real usage patterns.
