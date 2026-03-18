import { TrustContribution } from '../../utils/trustScores'
import { ellipseAddress } from '../../utils/ellipseAddress'
import { Badge } from '../ui/badge'

interface TrustTopContributorsListProps {
  contributions: TrustContribution[]
}

export function TrustTopContributorsList({ contributions }: TrustTopContributorsListProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Top contributors</p>
      <div className="space-y-2">
        {contributions.length === 0 && (
          <p className="rounded-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            No nodes in the current walk trust this target.
          </p>
        )}

        {contributions.slice(0, 6).map((item) => (
          <div key={`${item.account}-${item.depth}`} className="rounded-sm border border-border bg-card px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{ellipseAddress(item.account, 8)}</span>
              <Badge variant="secondary" className="w-fit">
                +{item.contribution.toFixed(3)}
              </Badge>
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              Path: {item.path.map((value) => ellipseAddress(value, 5)).join(' -> ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
