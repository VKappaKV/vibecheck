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
  peerInviteQrUrl: string
  peerInviteLink: string
  onCopyPeerInviteLink: () => Promise<void>
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
  peerInviteQrUrl,
  peerInviteLink,
  onCopyPeerInviteLink,
}: ProfileManagementPanelProps) {
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

      <MutationRow
        fieldId="mutation-app-id"
        label="APP id"
        placeholder="e.g. 12345"
        value={mutationAppIdInput}
        onChange={onMutationAppIdChange}
        addLabel="Add APP"
        removeLabel="Remove APP"
        onAdd={onAddTrustedApp}
        onRemove={onRemoveTrustedApp}
        isMutatingProfile={isMutatingProfile}
        type="number"
      />

      <MutationRow
        fieldId="mutation-asa-id"
        label="ASA id"
        placeholder="e.g. 31566704"
        value={mutationAsaIdInput}
        onChange={onMutationAsaIdChange}
        addLabel="Add ASA"
        removeLabel="Remove ASA"
        onAdd={onAddTrustedAsa}
        onRemove={onRemoveTrustedAsa}
        isMutatingProfile={isMutatingProfile}
        type="number"
      />

      <MutationRow
        fieldId="mutation-peer-address"
        label="Peer address"
        placeholder="Algorand address"
        value={mutationPeerInput}
        onChange={onMutationPeerChange}
        addLabel="Add peer"
        removeLabel="Remove peer"
        onAdd={onAddTrustedPeer}
        onRemove={onRemoveTrustedPeer}
        isMutatingProfile={isMutatingProfile}
      />

      <div className="rounded-sm border border-border bg-background/70 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Peer invite QR</p>
            <p className="text-xs text-muted-foreground">Share this so another user can prefill your address in their add-peer form.</p>
          </div>
          <Button variant="outline" onClick={() => void onCopyPeerInviteLink()} disabled={!peerInviteLink} className="w-full sm:w-auto">
            Copy invite URL
          </Button>
        </div>

        {peerInviteQrUrl ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <img src={peerInviteQrUrl} alt="Peer invite QR code" width={220} height={220} className="rounded-sm border border-border" />
            <Input readOnly value={peerInviteLink} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Connect wallet to generate your peer invite QR code.</p>
        )}
      </div>
    </div>
  )
}
