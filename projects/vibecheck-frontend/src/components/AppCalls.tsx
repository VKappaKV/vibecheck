import { useState } from 'react'
import {
  LiveDataControls,
  ProfileOverviewPanel,
  ProfileManagementPanel,
  ScoreTabsPanel,
  type TrustDemoSection,
  useTrustDemo,
} from './trust-demo'
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

        {activeSection === 'profile' && <ProfileOverviewPanel {...demo.profileOverview} />}

        {activeSection === 'add-trusted' && <ProfileManagementPanel {...demo.profileManagement} />}

        {activeSection === 'analyze-network' && (
          <>
            <LiveDataControls {...demo.analysisSection.liveDataControls} />

            <ScoreTabsPanel {...demo.analysisSection.scoreTabs} />

            <TrustNetworkAnalysis {...demo.analysisSection.networkAnalysis} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AppCalls
