import { useMemo, useState } from 'react'
import { AppWindow, Coins, Users, type LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ProfileManagementPanelProps {
  isMutatingProfile: boolean
  onInitProfile: () => Promise<void>
  mutationAppIdInput: string
  onMutationAppIdChange: (value: string) => void
  onAddTrustedApp: () => Promise<void>
  onRemoveTrustedApp: () => Promise<void>
  mutationAsaIdInput: string
  onMutationAsaIdChange: (value: string) => void
  onAddTrustedAsa: () => Promise<void>
  onRemoveTrustedAsa: () => Promise<void>
  mutationPeerInput: string
  onMutationPeerChange: (value: string) => void
  onAddTrustedPeer: () => Promise<void>
  onRemoveTrustedPeer: () => Promise<void>
}

interface MutationRowProps {
  fieldId: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  addLabel: string
  removeLabel: string
  onAdd: () => Promise<void>
  onRemove: () => Promise<void>
  isMutatingProfile: boolean
  type?: 'text' | 'number'
}

type MutationTarget = 'peer' | 'asa' | 'app'

interface MutationTargetOption {
  id: MutationTarget
  label: string
  icon: LucideIcon
}

function MutationRow({
  fieldId,
  label,
  placeholder,
  value,
  onChange,
  addLabel,
  removeLabel,
  onAdd,
  onRemove,
  isMutatingProfile,
  type = 'text',
}: MutationRowProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
        <Input
          id={fieldId}
          type={type}
          min={type === 'number' ? 1 : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <Button variant="secondary" onClick={() => void onAdd()} disabled={isMutatingProfile} className="w-full lg:w-auto">
        {addLabel}
      </Button>
      <Button variant="outline" onClick={() => void onRemove()} disabled={isMutatingProfile} className="w-full lg:w-auto">
        {removeLabel}
      </Button>
    </div>
  )
}

export function ProfileManagementPanel({
  isMutatingProfile,
  onInitProfile,
  mutationAppIdInput,
  onMutationAppIdChange,
  onAddTrustedApp,
  onRemoveTrustedApp,
  mutationAsaIdInput,
  onMutationAsaIdChange,
  onAddTrustedAsa,
  onRemoveTrustedAsa,
  mutationPeerInput,
  onMutationPeerChange,
  onAddTrustedPeer,
  onRemoveTrustedPeer,
}: ProfileManagementPanelProps) {
  const [activeMutationTarget, setActiveMutationTarget] = useState<MutationTarget>('peer')

  const mutationTargetOptions: MutationTargetOption[] = useMemo(
    () => [
      { id: 'peer', label: 'Peer', icon: Users },
      { id: 'asa', label: 'ASA', icon: Coins },
      { id: 'app', label: 'APP', icon: AppWindow },
    ],
    [],
  )

  const mutationRow =
    activeMutationTarget === 'app'
      ? {
          fieldId: 'mutation-app-id',
          label: 'APP id',
          placeholder: 'e.g. 12345',
          value: mutationAppIdInput,
          onChange: onMutationAppIdChange,
          addLabel: 'Add APP',
          removeLabel: 'Remove APP',
          onAdd: onAddTrustedApp,
          onRemove: onRemoveTrustedApp,
          type: 'number' as const,
        }
      : activeMutationTarget === 'asa'
        ? {
            fieldId: 'mutation-asa-id',
            label: 'ASA id',
            placeholder: 'e.g. 31566704',
            value: mutationAsaIdInput,
            onChange: onMutationAsaIdChange,
            addLabel: 'Add ASA',
            removeLabel: 'Remove ASA',
            onAdd: onAddTrustedAsa,
            onRemove: onRemoveTrustedAsa,
            type: 'number' as const,
          }
        : {
            fieldId: 'mutation-peer-address',
            label: 'Peer address',
            placeholder: 'Algorand address',
            value: mutationPeerInput,
            onChange: onMutationPeerChange,
            addLabel: 'Add peer',
            removeLabel: 'Remove peer',
            onAdd: onAddTrustedPeer,
            onRemove: onRemoveTrustedPeer,
            type: 'text' as const,
          }

  return (
    <div className="grid gap-4 rounded-sm border-2 border-border bg-card/70 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Manage your on-chain trust profile</p>
          <p className="text-xs text-muted-foreground">Add or remove APPs, ASAs, and peers directly on this app instance.</p>
        </div>
        <Button onClick={() => void onInitProfile()} disabled={isMutatingProfile} className="w-full sm:w-auto">
          {isMutatingProfile ? 'Working...' : 'Init profile'}
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {mutationTargetOptions.map((option) => {
          const Icon = option.icon
          const isActive = option.id === activeMutationTarget

          return (
            <Button
              key={option.id}
              type="button"
              variant={isActive ? 'secondary' : 'outline'}
              className="justify-center gap-2"
              onClick={() => setActiveMutationTarget(option.id)}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          )
        })}
      </div>

      <MutationRow
        fieldId={mutationRow.fieldId}
        label={mutationRow.label}
        placeholder={mutationRow.placeholder}
        value={mutationRow.value}
        onChange={mutationRow.onChange}
        addLabel={mutationRow.addLabel}
        removeLabel={mutationRow.removeLabel}
        onAdd={mutationRow.onAdd}
        onRemove={mutationRow.onRemove}
        isMutatingProfile={isMutatingProfile}
        type={mutationRow.type}
      />
    </div>
  )
}
