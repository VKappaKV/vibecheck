import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const { enqueueSnackbar } = useSnackbar()

  const { transactionSigner, activeAddress } = useWallet()

  const handleSubmitAlgo = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar('Sending transaction...', { variant: 'info' })
      const result = await algorand.send.payment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: receiverAddress,
        amount: algo(1),
      })
      enqueueSnackbar(`Transaction sent: ${result.txIds[0]}`, { variant: 'success' })
      setReceiverAddress('')
    } catch (e) {
      enqueueSnackbar('Failed to send transaction', { variant: 'error' })
    }

    setLoading(false)
  }

  return (
    <Dialog open={openModal} onOpenChange={setModalState}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send payment transaction</DialogTitle>
          <DialogDescription>Send a 1 ALGO demo payment to verify signer and network setup.</DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          data-test-id="receiver-address"
          placeholder="Provide wallet address"
          value={receiverAddress}
          onChange={(e) => {
            setReceiverAddress(e.target.value)
          }}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setModalState(!openModal)}>
            Close
          </Button>
          <Button data-test-id="send-algo" onClick={handleSubmitAlgo} disabled={receiverAddress.length !== 58 || loading}>
            {loading ? 'Sending...' : 'Send 1 Algo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default Transact
