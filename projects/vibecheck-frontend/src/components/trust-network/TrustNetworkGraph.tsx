import { useMemo } from 'react'
import { TrustNetworkAnalysis } from '../../utils/trustScores'
import { ellipseAddress } from '../../utils/ellipseAddress'

interface TrustNetworkGraphProps {
  analysis: TrustNetworkAnalysis
}

export function TrustNetworkGraph({ analysis }: TrustNetworkGraphProps) {
  // Precompute a deterministic node layout so rerenders stay visually stable.
  const graph = useMemo(() => {
    const width = 820
    const height = 280
    const paddingX = 30
    const paddingY = 30
    const maxDepth = Math.max(analysis.maxVisitedDepth, 1)

    const grouped = new Map<number, string[]>()
    for (const account of analysis.allVisitedAccounts) {
      const depth = analysis.depthByAccount[account] ?? 0
      const list = grouped.get(depth) ?? []
      list.push(account)
      grouped.set(depth, list)
    }

    const positions = new Map<string, { x: number; y: number }>()
    for (const [depth, accounts] of grouped.entries()) {
      accounts.sort()
      const x = paddingX + (depth / maxDepth) * (width - 2 * paddingX)
      const rowHeight = (height - 2 * paddingY) / Math.max(accounts.length, 1)
      accounts.forEach((account, index) => {
        positions.set(account, {
          x,
          y: paddingY + rowHeight * index + rowHeight / 2,
        })
      })
    }

    const contributorSet = new Set(analysis.contributions.map((item) => item.account))

    return {
      width,
      height,
      positions,
      contributorSet,
    }
  }, [analysis])

  return (
    <div className="space-y-2 rounded-sm border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Network map</p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          className="h-[220px] min-w-[640px] w-full rounded-sm bg-background/70 sm:h-[280px]"
        >
          {analysis.edges.map((edge) => {
            const from = graph.positions.get(edge.from)
            const to = graph.positions.get(edge.to)
            if (!from || !to) return null

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
              />
            )
          })}

          {analysis.allVisitedAccounts.map((account) => {
            const point = graph.positions.get(account)
            if (!point) return null

            const isContributor = graph.contributorSet.has(account)

            return (
              <g key={account} transform={`translate(${point.x}, ${point.y})`}>
                <circle
                  r={12}
                  fill={isContributor ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                />
                <text x={16} y={4} fill="hsl(var(--foreground))" fontSize={12} fontWeight={600}>
                  {ellipseAddress(account, 4)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">Highlighted nodes contribute directly to the selected target score.</p>
    </div>
  )
}
