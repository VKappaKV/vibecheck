import { useState } from 'react'
import { LiveDataControls } from './trust-demo/LiveDataControls'
import { ProfileOverviewPanel } from './trust-demo/ProfileOverviewPanel'
import { ProfileManagementPanel } from './trust-demo/ProfileManagementPanel'
import { ScoreTabsPanel } from './trust-demo/ScoreTabsPanel'
import { TrustDemoSection } from './trust-demo/types'
import { useTrustDemo } from './trust-demo/useTrustDemo'
import { TrustNetworkAnalysis } from './TrustNetworkAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const sections: Array<{ id: TrustDemoSection; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'add-trusted', label: 'Add Trusted' },
  { id: 'analyze-network', label: 'Analyze Network' },
]

const AppCalls = () => {
  const demo = useTrustDemo()
  const [activeSection, setActiveSection] = useState<TrustDemoSection>('profile')

  return (
    <Card className="neo-panel">
      <CardHeader>
        <CardTitle>Trust score demo for APPs and ASAs</CardTitle>
        <CardDescription>
          Navigate by section: start with your profile, then add trust entries, then inspect trust propagation and scores.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <nav aria-label="Trust demo sections" className="rounded-sm border-2 border-border bg-background/70 p-2">
          <ol className="flex flex-wrap items-center gap-1 text-xs uppercase tracking-[0.12em]">
            {sections.map((section, index) => {
              const isActive = section.id === activeSection

              return (
                <li key={section.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={[
                      'rounded-sm border-2 px-2 py-1 transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-secondary',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.label}
                  </button>
                  {index < sections.length - 1 && <span className="px-1 text-muted-foreground">/</span>}
                </li>
              )
            })}
          </ol>
        </nav>

        {activeSection === 'profile' && (
          <ProfileOverviewPanel
            activeAddress={demo.activeAddress}
            isLoadingProfileSummary={demo.isLoadingProfileSummary}
            profileSummaryError={demo.profileSummaryError}
            isProfileInitialized={demo.isProfileInitialized}
            nfdName={demo.nfdName}
            nfdAvatarUrl={demo.nfdAvatarUrl}
            asaOptInCount={demo.asaOptInCount}
            trustedAppCount={demo.trustedAppCount}
            trustedAsaCount={demo.trustedAsaCount}
            trustedPeerCount={demo.trustedPeerCount}
            peerInviteQrUrl={demo.peerInviteQrUrl}
            peerInviteLink={demo.peerInviteLink}
            onCopyPeerInviteLink={demo.copyPeerInviteLink}
          />
        )}

        {activeSection === 'add-trusted' && (
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
          />
        )}

        {activeSection === 'analyze-network' && (
          <>
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
              isLoadingOnChainProfiles={demo.isLoadingOnChainProfiles}
              onRefreshProfiles={() => void demo.loadOnChainProfiles()}
              onCopyShareUrl={() => void demo.copyShareLink()}
              loadedProfiles={demo.onChainProfiles.length}
              hasActiveAddress={Boolean(demo.activeAddress)}
              onChainError={demo.onChainError}
            />

            <ScoreTabsPanel
              tabValue={demo.tabValue}
              onTabChange={demo.setTabValue}
              appScores={demo.appScores}
              assetScores={demo.assetScores}
            />

            <TrustNetworkAnalysis
              expanded={demo.analysisExpanded}
              onToggle={() => demo.setAnalysisExpanded(!demo.analysisExpanded)}
              options={demo.scoreOptions}
              onOptionsChange={demo.setScoreOptions}
              analysis={demo.activeAnalysis}
              targetLabel={demo.activeTargetLabel}
              targetTypeLabel={demo.tabValue === 'apps' ? 'APP' : 'ASA'}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AppCalls
