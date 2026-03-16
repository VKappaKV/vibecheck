import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Separator } from './ui/separator'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <Dialog open={openModal} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select wallet provider</DialogTitle>
          <DialogDescription>Connect a wallet to run payment and trust score demos.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          {activeAddress && (
            <>
              <Account />
              <Separator />
            </>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <Button
                data-test-id={`${wallet.id}-connect`}
                variant="outline"
                className="justify-start gap-3"
                key={`provider-${wallet.id}`}
                onClick={() => wallet.connect()}
              >
                {!isKmd(wallet) && <img alt={`wallet_icon_${wallet.id}`} src={wallet.metadata.icon} className="h-6 w-6 object-contain" />}
                <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
              </Button>
            ))}
        </div>

        <DialogFooter>
          <Button data-test-id="close-wallet-modal" variant="secondary" onClick={closeModal}>
            Close
          </Button>
          {activeAddress && (
            <Button
              variant="destructive"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
            >
              Logout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
export default ConnectWallet
