import { mergeTrustDemoSearchParams, buildPeerInviteLink, buildQrCodeUrl, readTrustDemoSearchState } from '../utils/urls'

describe('trust demo urls', () => {
  it('preserves invite params when syncing trust-demo state', () => {
    const next = mergeTrustDemoSearchParams(new URLSearchParams('invitePeer=PEER123&foo=bar'), {
      seedAccount: 'SEED123',
      tabValue: 'assets',
      selectedAppId: 42n,
      selectedAssetId: 99n,
      analysisExpanded: true,
      scoreOptions: {
        maxDepth: 4,
        depthDecay: 0.25,
        directWeight: 1.5,
        peerWeight: 0.5,
      },
    })

    expect(next.get('invitePeer')).toBe('PEER123')
    expect(next.get('foo')).toBe('bar')
    expect(next.get('seed')).toBe('SEED123')
    expect(next.get('tab')).toBe('assets')
    expect(next.get('analysis')).toBe('1')
  })

  it('reads invite-prefill state from the current search params', () => {
    const state = readTrustDemoSearchState(new URLSearchParams('seed=SEED123&invitePeer=PEER123&tab=assets'))

    expect(state.seedAccount).toBe('SEED123')
    expect(state.invitePeerPrefill).toBe('PEER123')
    expect(state.tabValue).toBe('assets')
  })

  it('builds a peer invite link from the current page url', () => {
    const inviteLink = buildPeerInviteLink('https://example.com/demo?foo=bar', 'ADDR123')
    const inviteUrl = new URL(inviteLink)

    expect(inviteUrl.searchParams.get('foo')).toBe('bar')
    expect(inviteUrl.searchParams.get('seed')).toBe('ADDR123')
    expect(inviteUrl.searchParams.get('tab')).toBe('apps')
    expect(inviteUrl.searchParams.get('invitePeer')).toBe('ADDR123')
  })

  it('returns an empty qr url when there is nothing to encode', () => {
    expect(buildQrCodeUrl('')).toBe('')
  })
})
