export interface TrustProfile {
  account: string
  trustedApps: bigint[]
  trustedAsas: bigint[]
  trustedPeers: string[]
}

interface TrustScoreOptions {
  maxDepth?: number
  depthDecay?: number
  directWeight?: number
  peerWeight?: number
}

interface AppScoreRequest {
  seedAccount: string
  targetAppId: bigint
  profiles: TrustProfile[]
  options?: TrustScoreOptions
}

interface AssetScoreRequest {
  seedAccount: string
  targetAssetId: bigint
  profiles: TrustProfile[]
  options?: TrustScoreOptions
}

type QueueNode = {
  account: string
  depth: number
  influence: number
}

const DEFAULT_OPTIONS: Required<TrustScoreOptions> = {
  maxDepth: 3,
  depthDecay: 0.5,
  directWeight: 1,
  peerWeight: 0.75,
}

function normaliseAddress(address: string): string {
  return address.trim().toUpperCase()
}

function asProfileMap(profiles: TrustProfile[]): Map<string, TrustProfile> {
  const profileMap = new Map<string, TrustProfile>()
  for (const profile of profiles) {
    profileMap.set(normaliseAddress(profile.account), profile)
  }
  return profileMap
}

function scoreTarget(
  seedAccount: string,
  profiles: TrustProfile[],
  options: TrustScoreOptions,
  hasTarget: (profile: TrustProfile) => boolean,
): number {
  const merged = { ...DEFAULT_OPTIONS, ...options }
  const profileMap = asProfileMap(profiles)
  const visitedDepth = new Map<string, number>()
  const queue: QueueNode[] = [{ account: normaliseAddress(seedAccount), depth: 0, influence: 1 }]

  let score = 0

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    const knownDepth = visitedDepth.get(current.account)
    if (knownDepth !== undefined && knownDepth <= current.depth) {
      continue
    }
    visitedDepth.set(current.account, current.depth)

    const profile = profileMap.get(current.account)
    if (!profile) {
      continue
    }

    if (hasTarget(profile)) {
      score += current.depth === 0 ? current.influence * merged.directWeight : current.influence * merged.peerWeight
    }

    if (current.depth >= merged.maxDepth) {
      continue
    }

    const nextInfluence = current.influence * merged.depthDecay
    if (nextInfluence <= 0) {
      continue
    }

    for (const peer of profile.trustedPeers) {
      queue.push({ account: normaliseAddress(peer), depth: current.depth + 1, influence: nextInfluence })
    }
  }

  return Number(score.toFixed(8))
}

export function scoreAppTrust(request: AppScoreRequest): number {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedApps.some((appId) => appId === request.targetAppId),
  )
}

export function scoreAssetTrust(request: AssetScoreRequest): number {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedAsas.some((assetId) => assetId === request.targetAssetId),
  )
}
