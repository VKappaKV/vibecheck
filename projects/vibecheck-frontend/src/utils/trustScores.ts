export interface TrustProfile {
  account: string
  trustedApps: bigint[]
  trustedAsas: bigint[]
  trustedPeers: string[]
}

export interface TrustScoreOptions {
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

export interface TrustContribution {
  account: string
  depth: number
  influence: number
  contribution: number
  path: string[]
}

export interface TrustHopBreakdown {
  depth: number
  nodesVisited: number
  contribution: number
}

export interface TrustNetworkAnalysis {
  score: number
  seedAccount: string
  visitedAccounts: number
  maxVisitedDepth: number
  contributions: TrustContribution[]
  hopBreakdown: TrustHopBreakdown[]
  allVisitedAccounts: string[]
}

type QueueNode = {
  account: string
  depth: number
  influence: number
  parent?: string
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
): TrustNetworkAnalysis {
  const merged = { ...DEFAULT_OPTIONS, ...options }
  const profileMap = asProfileMap(profiles)
  const visitedDepth = new Map<string, number>()
  const parentMap = new Map<string, string>()
  const queue: QueueNode[] = [{ account: normaliseAddress(seedAccount), depth: 0, influence: 1 }]
  const contributions: Omit<TrustContribution, 'path'>[] = []

  let score = 0

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    const knownDepth = visitedDepth.get(current.account)
    if (knownDepth !== undefined && knownDepth <= current.depth) {
      continue
    }

    if (current.parent && !parentMap.has(current.account)) {
      parentMap.set(current.account, current.parent)
    }

    visitedDepth.set(current.account, current.depth)

    const profile = profileMap.get(current.account)
    if (!profile) {
      continue
    }

    if (hasTarget(profile)) {
      const contribution = current.depth === 0 ? current.influence * merged.directWeight : current.influence * merged.peerWeight
      score += contribution
      contributions.push({
        account: current.account,
        depth: current.depth,
        influence: Number(current.influence.toFixed(8)),
        contribution: Number(contribution.toFixed(8)),
      })
    }

    if (current.depth >= merged.maxDepth) {
      continue
    }

    const nextInfluence = current.influence * merged.depthDecay
    if (nextInfluence <= 0) {
      continue
    }

    for (const peer of profile.trustedPeers) {
      queue.push({ account: normaliseAddress(peer), depth: current.depth + 1, influence: nextInfluence, parent: current.account })
    }
  }

  const hopMap = new Map<number, TrustHopBreakdown>()
  for (const depth of visitedDepth.values()) {
    const hop = hopMap.get(depth) ?? { depth, nodesVisited: 0, contribution: 0 }
    hop.nodesVisited += 1
    hopMap.set(depth, hop)
  }

  for (const item of contributions) {
    const hop = hopMap.get(item.depth) ?? { depth: item.depth, nodesVisited: 0, contribution: 0 }
    hop.contribution = Number((hop.contribution + item.contribution).toFixed(8))
    hopMap.set(item.depth, hop)
  }

  const buildPath = (account: string): string[] => {
    const path: string[] = [account]
    let current = account
    while (parentMap.has(current)) {
      const parent = parentMap.get(current)
      if (!parent) {
        break
      }
      path.unshift(parent)
      current = parent
    }
    return path
  }

  return {
    score: Number(score.toFixed(8)),
    seedAccount: normaliseAddress(seedAccount),
    visitedAccounts: visitedDepth.size,
    maxVisitedDepth: Math.max(0, ...visitedDepth.values()),
    allVisitedAccounts: [...visitedDepth.entries()].sort((a, b) => a[1] - b[1]).map(([account]) => account),
    hopBreakdown: [...hopMap.values()].sort((a, b) => a.depth - b.depth),
    contributions: contributions
      .map((item) => ({ ...item, path: buildPath(item.account) }))
      .sort((a, b) => b.contribution - a.contribution),
  }
}

export function scoreAppTrust(request: AppScoreRequest): number {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedApps.some((appId) => appId === request.targetAppId),
  ).score
}

export function scoreAssetTrust(request: AssetScoreRequest): number {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedAsas.some((assetId) => assetId === request.targetAssetId),
  ).score
}

export function analyzeAppTrust(request: AppScoreRequest): TrustNetworkAnalysis {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedApps.some((appId) => appId === request.targetAppId),
  )
}

export function analyzeAssetTrust(request: AssetScoreRequest): TrustNetworkAnalysis {
  return scoreTarget(request.seedAccount, request.profiles, request.options ?? {}, (profile) =>
    profile.trustedAsas.some((assetId) => assetId === request.targetAssetId),
  )
}
