import { TrustProfile } from '../../../utils/trustScores'
import { buildScoreEntries, buildScoreTargets, compareBigInt } from '../utils/resourceHelpers'

const profiles: TrustProfile[] = [
  {
    account: 'ACCOUNT_A',
    trustedApps: [12n, 4n],
    trustedAsas: [7n],
    trustedPeers: [],
  },
  {
    account: 'ACCOUNT_B',
    trustedApps: [4n, 9n],
    trustedAsas: [2n, 7n],
    trustedPeers: [],
  },
]

describe('trust demo resource helpers', () => {
  it('sorts bigint values without coercing them to numbers', () => {
    expect([12n, 4n, 9n].sort(compareBigInt)).toEqual([4n, 9n, 12n])
  })

  it('returns the selected fallback target when no resources are present', () => {
    const targets = buildScoreTargets({
      profiles: [],
      selectedId: 88n,
      labelPrefix: 'APP',
      selectIds: (profile) => profile.trustedApps,
    })

    expect(targets).toEqual([{ id: 88n, label: 'APP 88' }])
  })

  it('builds sorted score targets and descending score entries', () => {
    const targets = buildScoreTargets({
      profiles,
      selectedId: 1n,
      labelPrefix: 'APP',
      selectIds: (profile) => profile.trustedApps,
    })

    const entries = buildScoreEntries({
      targets,
      getScore: (target) => Number(target.id),
    })

    expect(targets.map((target) => target.id)).toEqual([4n, 9n, 12n])
    expect(entries.map((entry) => entry.id)).toEqual([12n, 9n, 4n])
  })
})
