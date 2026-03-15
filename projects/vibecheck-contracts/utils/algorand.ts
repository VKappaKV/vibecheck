import { AlgorandClient } from '@algorandfoundation/algokit-utils'

export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
export const DEFAULT_PROFILE_INIT_MBR_PAYMENT = 300_000

export function getAlgorandClient(): AlgorandClient {
  return AlgorandClient.fromEnvironment()
}

export async function getAccountFromEnvironment(algorand: AlgorandClient, accountName = 'DEPLOYER') {
  try {
    return await algorand.account.fromEnvironment(accountName)
  } catch {
    return algorand.account.dispenserFromEnvironment()
  }
}
