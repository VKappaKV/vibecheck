import { isValidAddress } from 'algosdk'
import { VibecheckClient } from '../smart_contracts/artifacts/vibecheck/VibecheckClient'
import { ZERO_ADDRESS } from './algorand'
import { TrustProfile } from './trustScoring'

export async function readProfileSnapshot(client: VibecheckClient, account: string, sender: string): Promise<TrustProfile> {
  const result = await client
    .newGroup()
    .getTrustedApp({ sender, args: { account } })
    .getTrustedAsa({ sender, args: { account } })
    .getAdjacencyList({ sender, args: { account } })
    .simulate()

  const [trustedApps = [], trustedAsas = [], trustedPeers = []] = result.returns as [
    bigint[] | undefined,
    bigint[] | undefined,
    string[] | undefined,
  ]

  return {
    account,
    trustedApps,
    trustedAsas,
    trustedPeers: trustedPeers.filter((peer) => peer !== ZERO_ADDRESS && isValidAddress(peer)),
  }
}
