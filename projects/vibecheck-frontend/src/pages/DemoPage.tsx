import { useWallet } from '@txnlab/use-wallet-react'
import AppCalls from '../components/AppCalls'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function DemoPage() {
  const { activeAddress } = useWallet()

  return (
    <div className="space-y-4">
      <Card className="neo-panel">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Operational Console</Badge>
            {activeAddress ? <Badge variant="secondary">Wallet connected</Badge> : <Badge variant="outline">No wallet connected</Badge>}
          </div>
          <CardTitle className="text-3xl uppercase tracking-[0.08em]">Trust graph demo workspace</CardTitle>
          <CardDescription>Trust analytics is loaded directly below so you can start immediately.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No extra click required: the trust score workspace is already active.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Demo tips</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <p>1) Use the navbar wallet button to connect or disconnect.</p>
          <p>2) In on-chain mode, initialize your profile, then add/remove APP, ASA, and peer trust entries.</p>
          <p>3) Share your peer invite QR so others can add your address with one scan.</p>
        </CardContent>
      </Card>

      <AppCalls />
    </div>
  )
}
