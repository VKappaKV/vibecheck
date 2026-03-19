import { Copy, QrCode, ShieldCheck, ShieldOff, UserCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { ellipseAddress } from '../../utils/ellipseAddress'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'

interface ProfileOverviewPanelProps {
  activeAddress: string | null
  isLoadingProfileSummary: boolean
  profileSummaryError: string | null
  isProfileInitialized: boolean | null
  nfdName: string
  nfdAvatarUrl: string
  asaOptInCount: number
  trustedAppCount: number
  trustedAsaCount: number
  trustedPeerCount: number
  peerInviteQrUrl: string
  peerInviteLink: string
  onCopyPeerInviteLink: () => Promise<void>
}

interface MetricProps {
  label: string
  value: string
}

const Metric = ({ label, value }: MetricProps) => {
  return (
    <div className="rounded-sm border border-border bg-background/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function ProfileOverviewPanel({
  activeAddress,
  isLoadingProfileSummary,
  profileSummaryError,
  isProfileInitialized,
  nfdName,
  nfdAvatarUrl,
  asaOptInCount,
  trustedAppCount,
  trustedAsaCount,
  trustedPeerCount,
  peerInviteQrUrl,
  peerInviteLink,
  onCopyPeerInviteLink,
}: ProfileOverviewPanelProps) {
  if (!activeAddress) {
    return (
      <div className="rounded-sm border-2 border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground">
        Connect a wallet to view your trust profile, NFD identity, and on-chain counts.
      </div>
    )
  }

  const displayName = nfdName || ellipseAddress(activeAddress, 9)
  const derivedPeerInviteLink = useMemo(() => {
    const inviteUrl = new URL(window.location.href)
    inviteUrl.searchParams.set('seed', activeAddress)
    inviteUrl.searchParams.set('tab', 'apps')
    inviteUrl.searchParams.set('invitePeer', activeAddress)

    return inviteUrl.toString()
  }, [activeAddress])
  const effectivePeerInviteLink = peerInviteLink || derivedPeerInviteLink
  const effectivePeerInviteQrUrl =
    peerInviteQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(effectivePeerInviteLink)}`
  const initializationBadge =
    isProfileInitialized === null
      ? { label: 'Unknown', icon: ShieldOff }
      : isProfileInitialized
        ? { label: 'Initialized', icon: ShieldCheck }
        : { label: 'Not initialized', icon: ShieldOff }
  const InitializationIcon = initializationBadge.icon

  return (
    <div className="grid gap-4 rounded-sm border-2 border-border bg-card/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-sm border-2 border-border bg-muted">
            {nfdAvatarUrl ? (
              <img src={nfdAvatarUrl} alt="NFD profile" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserCircle2 className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">{displayName}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline">
                    <QrCode className="mr-1.5 h-4 w-4" />
                    Share QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Peer invite QR</DialogTitle>
                    <DialogDescription>Scan to open the demo with your address prefilled as peer.</DialogDescription>
                  </DialogHeader>

                  {effectivePeerInviteQrUrl ? (
                    <img
                      src={effectivePeerInviteQrUrl}
                      alt="Peer invite QR code"
                      width={280}
                      height={280}
                      className="mx-auto rounded-sm border border-border"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Unable to generate a peer invite QR code right now.</p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Input readOnly value={effectivePeerInviteLink} placeholder="Unable to generate invite URL" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => void onCopyPeerInviteLink()}
                      disabled={!effectivePeerInviteLink}
                      aria-label="Copy invite URL"
                      title="Copy invite URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{ellipseAddress(activeAddress, 10)}</p>
          </div>
        </div>

        <Badge variant={isProfileInitialized ? 'secondary' : 'outline'} className="w-fit gap-1">
          <InitializationIcon className="h-3.5 w-3.5" />
          {isLoadingProfileSummary ? 'Loading profile...' : initializationBadge.label}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="ASA opted in" value={asaOptInCount.toString()} />
        <Metric label="Trusted peers" value={trustedPeerCount.toString()} />
        <Metric label="Trusted ASAs" value={trustedAsaCount.toString()} />
        <Metric label="Trusted APPs" value={trustedAppCount.toString()} />
      </div>

      {profileSummaryError && (
        <div className="rounded-sm border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          Profile data warning: {profileSummaryError}
        </div>
      )}
    </div>
  )
}
