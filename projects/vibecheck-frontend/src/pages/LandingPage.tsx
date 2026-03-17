import { ArrowRight, Network, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Trust Profile Contract',
    description: 'Accounts publish trusted APP IDs, trusted ASA IDs, and trusted peers. This creates a social trust substrate on Algorand.',
  },
  {
    icon: Network,
    title: 'Propagation Engine',
    description: 'Confidence moves through trusted peers with configurable decay. Close recommendations count more than distant ones.',
  },
  {
    icon: Sparkles,
    title: 'Actionable Scoring',
    description: 'The demo ranks APPs and ASAs, then expands into hop-by-hop network analysis so you can inspect why a score exists.',
  },
]

export default function LandingPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="neo-panel overflow-hidden p-5 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="space-y-4">
            <Badge className="w-fit">Neo Industrial Trust Graph</Badge>
            <h1 className="text-2xl font-semibold uppercase tracking-[0.08em] sm:text-4xl">Vibecheck for Algorand trust intelligence</h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Vibecheck helps teams and users evaluate ecosystem confidence for applications and assets by combining direct trust
              declarations with network propagation. You can see rankings, inspect network paths, and tune scoring behavior in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild data-test-id="open-demo" className="w-full sm:w-auto">
                <Link to="/demo" className="gap-2">
                  Open Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="bg-background/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl uppercase tracking-wide">Project at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>- Smart contract stores trust adjacency and APP/ASA endorsements.</p>
              <p>- SDK and frontend use consistent scoring logic.</p>
              <p>- Demo includes explainable trust analytics.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <pillar.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg uppercase tracking-wide">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">{pillar.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="neo-panel p-5 sm:p-6">
        <h2 className="text-xl font-semibold uppercase tracking-[0.06em]">How the trust score works</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A score starts with direct trust from your selected account, then expands to trusted peers. Every hop can still contribute, but
          less than the previous hop. This produces a practical confidence signal and gives context around local consensus instead of a
          black-box rating.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">Direct trust</Badge>
          <Badge variant="outline">Peer propagation</Badge>
          <Badge variant="outline">Depth decay</Badge>
          <Badge variant="outline">Explainable path analysis</Badge>
        </div>
      </section>
    </div>
  )
}
