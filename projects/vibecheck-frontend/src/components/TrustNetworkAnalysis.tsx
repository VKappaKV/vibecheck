import { HelpCircle } from 'lucide-react'
import { TrustNetworkAnalysis as TrustNetworkAnalysisData, TrustScoreOptions } from '../utils/trustScores'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Separator } from './ui/separator'

interface TrustNetworkAnalysisProps {
  expanded: boolean
  onToggle: () => void
  options: Required<TrustScoreOptions>
  onOptionsChange: (next: Required<TrustScoreOptions>) => void
  analysis: TrustNetworkAnalysisData
  targetLabel: string
  targetTypeLabel: string
}

export function TrustNetworkAnalysis({
  expanded,
  onToggle,
  options,
  onOptionsChange,
  analysis,
  targetLabel,
  targetTypeLabel,
}: TrustNetworkAnalysisProps) {
  const updateOption = (key: keyof Required<TrustScoreOptions>, value: number) => {
    if (Number.isNaN(value)) {
      return
    }

    if (key === 'maxDepth') {
      onOptionsChange({ ...options, [key]: Math.max(0, Math.min(6, Math.round(value))) })
      return
    }

    onOptionsChange({ ...options, [key]: Number(value.toFixed(2)) })
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full justify-between" onClick={onToggle}>
        <span>{expanded ? 'Hide trust network analysis' : 'Analyze trust network'}</span>
        <span className="text-xs text-muted-foreground">{expanded ? 'Collapse' : 'Expand'}</span>
      </Button>

      {expanded && (
        <Card className="border-2 border-border bg-background/80">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">
                {targetTypeLabel} network for {targetLabel}
              </CardTitle>
              <Badge variant="secondary">Score {analysis.score.toFixed(3)}</Badge>
            </div>
            <CardDescription>
              Score spreads from the seed account through trusted peers, with each hop carrying less influence based on your decay settings.
            </CardDescription>
            <details className="group rounded-sm border border-dashed border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
                <HelpCircle className="h-4 w-4" />
                How this score is computed
              </summary>
              <p className="mt-2 leading-relaxed">
                We start from one account, then walk its trusted peers one level at a time. Direct trust has stronger weight. Peer trust
                still matters, but gets discounted each hop so distant recommendations count less. This gives you a practical signal of
                network confidence, not a final truth.
              </p>
            </details>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs uppercase tracking-wide text-muted-foreground">
                Max depth
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={options.maxDepth}
                  onChange={(event) => updateOption('maxDepth', Number(event.target.value))}
                />
              </label>
              <label className="space-y-1 text-xs uppercase tracking-wide text-muted-foreground">
                Depth decay
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={options.depthDecay}
                  onChange={(event) => updateOption('depthDecay', Number(event.target.value))}
                />
              </label>
              <label className="space-y-1 text-xs uppercase tracking-wide text-muted-foreground">
                Direct weight
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={options.directWeight}
                  onChange={(event) => updateOption('directWeight', Number(event.target.value))}
                />
              </label>
              <label className="space-y-1 text-xs uppercase tracking-wide text-muted-foreground">
                Peer weight
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={options.peerWeight}
                  onChange={(event) => updateOption('peerWeight', Number(event.target.value))}
                />
              </label>
            </div>

            <Separator />

            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric title="Visited accounts" value={analysis.visitedAccounts.toString()} />
              <Metric title="Max hop reached" value={analysis.maxVisitedDepth.toString()} />
              <Metric title="Contributing nodes" value={analysis.contributions.length.toString()} />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hop breakdown</p>
              <div className="space-y-2">
                {analysis.hopBreakdown.map((hop) => (
                  <div
                    key={hop.depth}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-sm border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">Depth {hop.depth}</span>
                    <span className="text-xs text-muted-foreground">Nodes {hop.nodesVisited}</span>
                    <Badge variant="outline">+{hop.contribution.toFixed(3)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top contributors</p>
              <div className="space-y-2">
                {analysis.contributions.length === 0 && (
                  <p className="rounded-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    No nodes in the current walk trust this target.
                  </p>
                )}
                {analysis.contributions.slice(0, 6).map((item) => (
                  <div key={`${item.account}-${item.depth}`} className="rounded-sm border border-border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{item.account}</span>
                      <Badge variant="secondary">+{item.contribution.toFixed(3)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Path: {item.path.join(' -> ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MetricProps {
  title: string
  value: string
}

const Metric = ({ title, value }: MetricProps) => {
  return (
    <div className="rounded-sm border border-border bg-card px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
