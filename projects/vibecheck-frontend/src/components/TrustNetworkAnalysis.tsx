import { HelpCircle } from 'lucide-react'
import { TrustNetworkAnalysis as TrustNetworkAnalysisData, TrustScoreOptions } from '../utils/trustScores'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { TrustHopBreakdownList } from './trust-network/TrustHopBreakdownList'
import { TrustNetworkGraph } from './trust-network/TrustNetworkGraph'
import { TrustScoreOptionsForm } from './trust-network/TrustScoreOptionsForm'
import { TrustTopContributorsList } from './trust-network/TrustTopContributorsList'

interface TrustNetworkAnalysisProps {
  expanded: boolean
  onToggle: () => void
  options: Required<TrustScoreOptions>
  onOptionsChange: (next: Required<TrustScoreOptions>) => void
  analysis: TrustNetworkAnalysisData
  targetLabel: string
  targetTypeLabel: string
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

export function TrustNetworkAnalysis({
  expanded,
  onToggle,
  options,
  onOptionsChange,
  analysis,
  targetLabel,
  targetTypeLabel,
}: TrustNetworkAnalysisProps) {
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
            <TrustScoreOptionsForm options={options} onOptionsChange={onOptionsChange} />

            <Separator />

            <div className="grid gap-3 text-sm md:grid-cols-3">
              <Metric title="Visited accounts" value={analysis.visitedAccounts.toString()} />
              <Metric title="Max hop reached" value={analysis.maxVisitedDepth.toString()} />
              <Metric title="Contributing nodes" value={analysis.contributions.length.toString()} />
            </div>

            <TrustNetworkGraph analysis={analysis} />
            <TrustHopBreakdownList hopBreakdown={analysis.hopBreakdown} />
            <TrustTopContributorsList contributions={analysis.contributions} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
