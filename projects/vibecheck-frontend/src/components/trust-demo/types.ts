export type ScoreTab = 'apps' | 'assets'

export type TrustDemoSection = 'profile' | 'add-trusted' | 'analyze-network'

export interface ScoreTarget {
  id: bigint
  label: string
}

export interface ScoreEntry extends ScoreTarget {
  score: number
}
