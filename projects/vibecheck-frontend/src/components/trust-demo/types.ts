export type ScoreTab = 'apps' | 'assets'

export interface ScoreTarget {
  id: bigint
  label: string
}

export interface ScoreEntry extends ScoreTarget {
  score: number
}
