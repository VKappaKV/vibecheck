import { TrustProfile } from '../../../utils/trustScores'
import { ScoreEntry, ScoreTarget } from '../types'

interface BuildScoreTargetsArgs {
  profiles: TrustProfile[]
  selectedId: bigint
  labelPrefix: 'APP' | 'ASA'
  selectIds: (profile: TrustProfile) => bigint[]
}

interface BuildScoreEntriesArgs {
  targets: ScoreTarget[]
  getScore: (target: ScoreTarget) => number
}

export function compareBigInt(a: bigint, b: bigint): number {
  if (a === b) {
    return 0
  }

  return a < b ? -1 : 1
}

export function buildScoreTargets({ profiles, selectedId, labelPrefix, selectIds }: BuildScoreTargetsArgs): ScoreTarget[] {
  const uniqueIds = new Set(profiles.flatMap(selectIds))

  if (uniqueIds.size === 0) {
    return [{ id: selectedId, label: `${labelPrefix} ${selectedId.toString()}` }]
  }

  return [...uniqueIds].sort(compareBigInt).map((id) => ({
    id,
    label: `${labelPrefix} ${id.toString()}`,
  }))
}

export function buildScoreEntries({ targets, getScore }: BuildScoreEntriesArgs): ScoreEntry[] {
  return targets
    .map((target) => ({
      ...target,
      score: getScore(target),
    }))
    .sort((left, right) => right.score - left.score)
}
