import { TrustNetworkAnalysis } from './TrustNetworkAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LiveDataControls } from './trust-demo/LiveDataControls'
import { ProfileManagementPanel } from './trust-demo/ProfileManagementPanel'
import { ScoreTabsPanel } from './trust-demo/ScoreTabsPanel'
import { useTrustDemo } from './trust-demo/useTrustDemo'

const AppCalls = () => {
  const demo = useTrustDemo()

  return (
    <Card className="neo-panel">
      <CardHeader>
        <CardTitle>Trust score demo for APPs and ASAs</CardTitle>
        <CardDescription>
          The demo reads live on-chain trust data from your profile network and keeps your scoring setup shareable through URL params.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <LiveDataControls
          seedAccount={demo.seedAccount}
          seedAccounts={demo.seedAccounts}
          onSeedAccountChange={demo.setSeedAccount}
          appTargets={demo.appTargets}
          selectedAppId={demo.selectedAppId}
          onSelectAppId={demo.setSelectedAppId}
          assetTargets={demo.assetTargets}
          selectedAssetId={demo.selectedAssetId}
          onSelectAssetId={demo.setSelectedAssetId}
          onChainAppId={demo.onChainAppId}
          onOnChainAppIdChange={demo.setOnChainAppId}
          isLoadingOnChainProfiles={demo.isLoadingOnChainProfiles}
          onRefreshProfiles={() => void demo.loadOnChainProfiles()}
          onCopyShareUrl={() => void demo.copyShareLink()}
          loadedProfiles={demo.onChainProfiles.length}
          hasActiveAddress={Boolean(demo.activeAddress)}
          onChainError={demo.onChainError}
        />

        <ProfileManagementPanel
          isMutatingProfile={demo.isMutatingProfile}
          onInitProfile={demo.initProfile}
          mutationAppIdInput={demo.mutationAppIdInput}
          onMutationAppIdChange={demo.setMutationAppIdInput}
          onAddTrustedApp={demo.addTrustedApp}
          onRemoveTrustedApp={demo.removeTrustedApp}
          mutationAsaIdInput={demo.mutationAsaIdInput}
          onMutationAsaIdChange={demo.setMutationAsaIdInput}
          onAddTrustedAsa={demo.addTrustedAsa}
          onRemoveTrustedAsa={demo.removeTrustedAsa}
          mutationPeerInput={demo.mutationPeerInput}
          onMutationPeerChange={demo.setMutationPeerInput}
          onAddTrustedPeer={demo.addTrustedPeer}
          onRemoveTrustedPeer={demo.removeTrustedPeer}
          peerInviteQrUrl={demo.peerInviteQrUrl}
          peerInviteLink={demo.peerInviteLink}
          onCopyPeerInviteLink={demo.copyPeerInviteLink}
        />

        <ScoreTabsPanel tabValue={demo.tabValue} onTabChange={demo.setTabValue} appScores={demo.appScores} assetScores={demo.assetScores} />

        <TrustNetworkAnalysis
          expanded={demo.analysisExpanded}
          onToggle={() => demo.setAnalysisExpanded(!demo.analysisExpanded)}
          options={demo.scoreOptions}
          onOptionsChange={demo.setScoreOptions}
          analysis={demo.activeAnalysis}
          targetLabel={demo.activeTargetLabel}
          targetTypeLabel={demo.tabValue === 'apps' ? 'APP' : 'ASA'}
        />
      </CardContent>
    </Card>
  )
}

export default AppCalls
