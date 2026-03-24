import { TrustScoreOptions } from '../../../utils/trustScores'
import { ScoreTab } from '../types'

export function parseScoreTab(value: string | null): ScoreTab {
  return value === 'assets' ? 'assets' : 'apps'
}

export function parseBigInt(value: string | null, fallback: bigint): bigint {
  try {
    return value ? BigInt(value) : fallback
  } catch {
    return fallback
  }
}

export function parseNumberInRange(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, parsed))
}

export function parsePositiveBigInt(value: string): bigint | null {
  try {
    const parsed = BigInt(value)
    return parsed > 0n ? parsed : null
  } catch {
    return null
  }
}

export function toPercent(score: number): number {
  return Math.min(100, Math.round(score * 40))
}

export function parseScoreOptions(searchParams: URLSearchParams, defaults: Required<TrustScoreOptions>): Required<TrustScoreOptions> {
  return {
    maxDepth: parseNumberInRange(searchParams.get('depth'), defaults.maxDepth, 0, 6),
    depthDecay: parseNumberInRange(searchParams.get('decay'), defaults.depthDecay, 0, 1),
    directWeight: parseNumberInRange(searchParams.get('dw'), defaults.directWeight, 0, 20),
    peerWeight: parseNumberInRange(searchParams.get('pw'), defaults.peerWeight, 0, 20),
  }
}
