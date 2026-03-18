import { TrustScoreOptions } from '../../utils/trustScores'
import { Input } from '../ui/input'

interface TrustScoreOptionsFormProps {
  options: Required<TrustScoreOptions>
  onOptionsChange: (next: Required<TrustScoreOptions>) => void
}

export function TrustScoreOptionsForm({ options, onOptionsChange }: TrustScoreOptionsFormProps) {
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
  )
}
