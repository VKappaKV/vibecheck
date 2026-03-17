import { TrustScoreOptions } from '../../utils/trustScores'

export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
export const PROFILE_INIT_MBR = 300_000

export const DEFAULT_OPTIONS: Required<TrustScoreOptions> = {
  maxDepth: 3,
  depthDecay: 0.5,
  directWeight: 1,
  peerWeight: 0.75,
}
