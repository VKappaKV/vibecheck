import { isValidAddress } from 'algosdk'
import { VibecheckClient } from '../../contracts/Vibecheck'
import { TrustProfile } from '../../utils/trustScores'
import { ZERO_ADDRESS } from './constants'

/**
 * Walk trusted peers breadth-first so score calculations use real graph topology.
 */
export async function collectProfilesFromChain(
  client: VibecheckClient,
  seedAccount: string,
  sender: string,
  maxDepth: number,
): Promise<TrustProfile[]> {
  const visited = new Set<string>()
  const queue: Array<{ account: string; depth: number }> = [{ account: seedAccount, depth: 0 }]
  const profiles: TrustProfile[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    if (visited.has(current.account)) {
      continue
    }
    visited.add(current.account)

    const [trustedApps, trustedAsas, trustedPeers] = await Promise.all([
      client.getTrustedApp({ sender, args: { account: current.account } }),
      client.getTrustedAsa({ sender, args: { account: current.account } }),
      client.getAdjacencyList({ sender, args: { account: current.account } }),
    ])

    const nextPeers = trustedPeers.filter((peer) => peer !== ZERO_ADDRESS && isValidAddress(peer))

    profiles.push({
      account: current.account,
      trustedApps,
      trustedAsas,
      trustedPeers: nextPeers,
    })

    if (current.depth >= maxDepth) {
      continue
    }

    for (const peer of nextPeers) {
      queue.push({ account: peer, depth: current.depth + 1 })
    }
  }

  return profiles
}
