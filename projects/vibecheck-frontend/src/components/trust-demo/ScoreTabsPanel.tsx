import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toPercent } from './parsers'
import { ScoreEntry, ScoreTab } from './types'

interface ScoreTabsPanelProps {
  tabValue: ScoreTab
  onTabChange: (value: ScoreTab) => void
  appScores: ScoreEntry[]
  assetScores: ScoreEntry[]
}

interface EmptyScoreStateProps {
  resourceLabel: 'APP' | 'ASA'
}

interface ScoreRowProps {
  label: string
  idLabel: string
  score: number
}

const EmptyScoreState = ({ resourceLabel }: EmptyScoreStateProps) => (
  <div className="rounded-sm border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
    No {resourceLabel} endorsements found yet in the loaded network. Add trust entries to your profile or refresh the network.
  </div>
)

const ScoreRow = ({ label, idLabel, score }: ScoreRowProps) => {
  return (
    <div className="rounded-sm border-2 border-border bg-background/70 p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{idLabel}</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          score {score.toFixed(3)}
        </Badge>
      </div>
      <div className="h-2 w-full rounded-sm bg-muted">
        <div className="h-2 rounded-sm bg-primary transition-all" style={{ width: `${toPercent(score)}%` }} />
      </div>
    </div>
  )
}

function ScoreContent({ scores, idPrefix }: { scores: ScoreEntry[]; idPrefix: 'APP' | 'ASA' }) {
  if (scores.length === 0) {
    return <EmptyScoreState resourceLabel={idPrefix} />
  }

  return (
    <div className="space-y-3">
      {scores.map((item) => (
        <ScoreRow key={item.id.toString()} label={item.label} idLabel={`${idPrefix} ${item.id.toString()}`} score={item.score} />
      ))}
    </div>
  )
}

export function ScoreTabsPanel({ tabValue, onTabChange, appScores, assetScores }: ScoreTabsPanelProps) {
  return (
    <Tabs value={tabValue} onValueChange={(value) => onTabChange(value as ScoreTab)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="apps">APP scores</TabsTrigger>
        <TabsTrigger value="assets">ASA scores</TabsTrigger>
      </TabsList>

      <TabsContent value="apps">
        <ScoreContent scores={appScores} idPrefix="APP" />
      </TabsContent>

      <TabsContent value="assets">
        <ScoreContent scores={assetScores} idPrefix="ASA" />
      </TabsContent>
    </Tabs>
  )
}
