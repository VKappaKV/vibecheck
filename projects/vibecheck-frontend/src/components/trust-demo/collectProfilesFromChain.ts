import { VibecheckClient } from '../../contracts/Vibecheck'
import { TrustProfile } from '../../utils/trustScores'
import { readProfileSnapshot } from './readProfileSnapshot'

/**
 * Walk trusted peers breadth-first so score calculations use real graph topology.
 */
export async function collectProfilesFromChain(
  client: VibecheckClient,
  seedAccount: string,
  maxDepth: number,
): Promise<TrustProfile[]> {
  const visited = new Set<string>()
  const queued = new Set<string>([seedAccount])
  const queue: Array<{ account: string; depth: number }> = [{ account: seedAccount, depth: 0 }]
  const profiles: TrustProfile[] = []

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    if (visited.has(current.account)) {
      continue
    }
    visited.add(current.account)

    const profile = await readProfileSnapshot({
      client,
      account: current.account,
    })

    profiles.push(profile)

    if (current.depth >= maxDepth) {
      continue
    }

    for (const peer of profile.trustedPeers) {
      if (visited.has(peer) || queued.has(peer)) {
        continue
      }

      queued.add(peer)
      queue.push({ account: peer, depth: current.depth + 1 })
    }
  }

  return profiles
}
