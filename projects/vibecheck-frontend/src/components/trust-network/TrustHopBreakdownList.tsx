import { TrustHopBreakdown } from '../../utils/trustScores'
import { Badge } from '../ui/badge'

interface TrustHopBreakdownListProps {
  hopBreakdown: TrustHopBreakdown[]
}

export function TrustHopBreakdownList({ hopBreakdown }: TrustHopBreakdownListProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Hop breakdown</p>
      <div className="space-y-2">
        {hopBreakdown.map((hop) => (
          <div
            key={hop.depth}
            className="grid gap-2 rounded-sm border border-border bg-card px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <span className="text-sm font-medium">Depth {hop.depth}</span>
            <span className="text-xs text-muted-foreground">Nodes {hop.nodesVisited}</span>
            <Badge variant="outline" className="w-fit">
              +{hop.contribution.toFixed(3)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
