import { TrustScoreOptions } from '../../../utils/trustScores'
import { DEFAULT_OPTIONS } from '../constants'
import { ScoreTab } from '../types'
import { parseBigInt, parseScoreOptions, parseScoreTab } from './parsers'

export interface TrustDemoSearchState {
  seedAccount: string
  tabValue: ScoreTab
  selectedAppId: bigint
  selectedAssetId: bigint
  analysisExpanded: boolean
  scoreOptions: Required<TrustScoreOptions>
  invitePeerPrefill: string
}

type PersistedTrustDemoSearchState = Omit<TrustDemoSearchState, 'invitePeerPrefill'>

function setOrDelete(next: URLSearchParams, key: string, value: string) {
  if (value) {
    next.set(key, value)
    return
  }

  next.delete(key)
}

export function readTrustDemoSearchState(
  searchParams: URLSearchParams,
  defaults: Required<TrustScoreOptions> = DEFAULT_OPTIONS,
): TrustDemoSearchState {
  return {
    seedAccount: searchParams.get('seed') ?? '',
    tabValue: parseScoreTab(searchParams.get('tab')),
    selectedAppId: parseBigInt(searchParams.get('appTarget'), 1n),
    selectedAssetId: parseBigInt(searchParams.get('asaTarget'), 1n),
    analysisExpanded: searchParams.get('analysis') === '1',
    scoreOptions: parseScoreOptions(searchParams, defaults),
    invitePeerPrefill: searchParams.get('invitePeer') ?? '',
  }
}

export function mergeTrustDemoSearchParams(searchParams: URLSearchParams, state: PersistedTrustDemoSearchState): URLSearchParams {
  const next = new URLSearchParams(searchParams)

  setOrDelete(next, 'seed', state.seedAccount)
  next.set('tab', state.tabValue)
  next.set('appTarget', state.selectedAppId.toString())
  next.set('asaTarget', state.selectedAssetId.toString())
  next.set('depth', String(state.scoreOptions.maxDepth))
  next.set('decay', String(state.scoreOptions.depthDecay))
  next.set('dw', String(state.scoreOptions.directWeight))
  next.set('pw', String(state.scoreOptions.peerWeight))
  next.set('analysis', state.analysisExpanded ? '1' : '0')

  return next
}

export function getCurrentBrowserHref(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.href
}

export function buildPeerInviteLink(currentHref: string, activeAddress: string | null): string {
  if (!currentHref || !activeAddress) {
    return ''
  }

  const inviteUrl = new URL(currentHref)
  inviteUrl.searchParams.set('seed', activeAddress)
  inviteUrl.searchParams.set('tab', 'apps')
  inviteUrl.searchParams.set('invitePeer', activeAddress)

  return inviteUrl.toString()
}

export function buildQrCodeUrl(value: string): string {
  if (!value) {
    return ''
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(value)}`
}

export async function copyTextToClipboard(value: string): Promise<boolean> {
  if (!value || typeof navigator === 'undefined' || !navigator.clipboard) {
    return false
  }

  await navigator.clipboard.writeText(value)
  return true
}
