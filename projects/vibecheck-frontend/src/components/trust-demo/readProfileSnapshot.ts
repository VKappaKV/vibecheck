import { isValidAddress } from 'algosdk'
import { VibecheckClient } from '../../contracts/Vibecheck'
import { TrustProfile } from '../../utils/trustScores'
import { ZERO_ADDRESS } from './constants'

interface ReadProfileSnapshotArgs {
  client: VibecheckClient
  account: string
}

export async function readProfileSnapshot({ client, account }: ReadProfileSnapshotArgs): Promise<TrustProfile> {
  const [trustedApps = [], trustedAsas = [], trustedPeers = []] = await Promise.all([
    client.state.box.trustedApp.value(account),
    client.state.box.trustedAsa.value(account),
    client.state.box.adjacencyList.value(account),
  ])

  return {
    account,
    trustedApps,
    trustedAsas,
    trustedPeers: trustedPeers.filter((peer) => peer !== ZERO_ADDRESS && isValidAddress(peer)),
  }
}
