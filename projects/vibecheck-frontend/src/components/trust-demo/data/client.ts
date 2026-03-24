import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { VibecheckClient, VibecheckFactory } from '../../../contracts/Vibecheck'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../../../utils/network/getAlgoClientConfigs'
import { parsePositiveBigInt } from '../utils/parsers'

export const TRUST_DEMO_ALGOD_CONFIG = getAlgodConfigFromViteEnvironment()
export const TRUST_DEMO_INDEXER_CONFIG = getIndexerConfigFromViteEnvironment()

interface CreateVibecheckAppClientArgs {
  algorand: AlgorandClient
  activeAddress: string | null
  onChainAppId: string
}

export function createTrustDemoAlgorandClient(): AlgorandClient {
  return AlgorandClient.fromConfig({
    algodConfig: TRUST_DEMO_ALGOD_CONFIG,
    indexerConfig: TRUST_DEMO_INDEXER_CONFIG,
  })
}

export function getConfiguredVibecheckAppId(): string {
  const parsed = parsePositiveBigInt(import.meta.env.VITE_VIBECHECK_APP_ID?.trim() ?? '')
  return parsed ? parsed.toString() : ''
}

export function createVibecheckAppClient({ algorand, activeAddress, onChainAppId }: CreateVibecheckAppClientArgs): VibecheckClient | null {
  const appId = parsePositiveBigInt(onChainAppId.trim())

  if (!activeAddress || !appId) {
    return null
  }

  return new VibecheckFactory({
    algorand,
    defaultSender: activeAddress,
  }).getAppClientById({ appId })
}
