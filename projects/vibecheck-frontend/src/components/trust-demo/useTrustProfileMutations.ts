import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { isValidAddress } from 'algosdk'
import { useCallback, useState } from 'react'
import { VibecheckClient, VibecheckFactory } from '../../contracts/Vibecheck'
import { PROFILE_INIT_MBR } from './constants'
import { parsePositiveBigInt } from './parsers'

type WalletSigner = ReturnType<typeof useWallet>['transactionSigner']
type EnqueueSnackbar = (message: string, options?: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info' }) => void

interface OnChainClientContext {
  appClient: VibecheckClient
  sender: string
  signer: NonNullable<WalletSigner>
}

interface UseTrustProfileMutationsArgs {
  algorand: AlgorandClient
  activeAddress: string | null
  transactionSigner: WalletSigner
  onChainAppId: string
  mutationAppIdInput: string
  mutationAsaIdInput: string
  mutationPeerInput: string
  enqueueSnackbar: EnqueueSnackbar
  refreshProfiles: () => Promise<void>
}

export function useTrustProfileMutations({
  algorand,
  activeAddress,
  transactionSigner,
  onChainAppId,
  mutationAppIdInput,
  mutationAsaIdInput,
  mutationPeerInput,
  enqueueSnackbar,
  refreshProfiles,
}: UseTrustProfileMutationsArgs) {
  const [isMutatingProfile, setIsMutatingProfile] = useState<boolean>(false)

  const getOnChainClientContext = useCallback((): OnChainClientContext | null => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Connect a wallet before updating trust lists', { variant: 'warning' })
      return null
    }

    const appId = parsePositiveBigInt(onChainAppId.trim())
    if (!appId) {
      enqueueSnackbar('Provide a valid Vibecheck app id', { variant: 'error' })
      return null
    }

    const factory = new VibecheckFactory({
      algorand,
      defaultSender: activeAddress,
    })

    return {
      appClient: factory.getAppClientById({ appId }),
      sender: activeAddress,
      signer: transactionSigner,
    }
  }, [activeAddress, algorand, enqueueSnackbar, onChainAppId, transactionSigner])

  const runProfileMutation = useCallback(
    async (successMessage: string, mutation: (context: OnChainClientContext) => Promise<unknown>) => {
      const context = getOnChainClientContext()
      if (!context) {
        return
      }

      setIsMutatingProfile(true)
      try {
        await mutation(context)
        enqueueSnackbar(successMessage, { variant: 'success' })
        await refreshProfiles()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile update failed'
        enqueueSnackbar(message, { variant: 'error' })
      } finally {
        setIsMutatingProfile(false)
      }
    },
    [enqueueSnackbar, getOnChainClientContext, refreshProfiles],
  )

  const initProfile = async () => {
    await runProfileMutation('Profile initialized', async ({ appClient, sender, signer }) => {
      const payMbr = await algorand.createTransaction.payment({
        sender,
        receiver: appClient.appAddress,
        amount: microAlgo(PROFILE_INIT_MBR),
      })

      await appClient.send.init({
        sender,
        signer,
        args: { payMbr },
      })
    })
  }

  const addTrustedApp = async () => {
    const appId = parsePositiveBigInt(mutationAppIdInput.trim())
    if (!appId) {
      enqueueSnackbar('APP id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added APP ${appId.toString()} to your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedApps({
        sender,
        signer,
        args: { apps: [appId] },
      })
    })
  }

  const removeTrustedApp = async () => {
    const appId = parsePositiveBigInt(mutationAppIdInput.trim())
    if (!appId) {
      enqueueSnackbar('APP id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed APP ${appId.toString()} from your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.removeApp({
        sender,
        signer,
        args: { app: appId },
      })
    })
  }

  const addTrustedAsa = async () => {
    const asaId = parsePositiveBigInt(mutationAsaIdInput.trim())
    if (!asaId) {
      enqueueSnackbar('ASA id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added ASA ${asaId.toString()} to your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedAsas({
        sender,
        signer,
        args: { assets: [asaId] },
      })
    })
  }

  const removeTrustedAsa = async () => {
    const asaId = parsePositiveBigInt(mutationAsaIdInput.trim())
    if (!asaId) {
      enqueueSnackbar('ASA id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed ASA ${asaId.toString()} from your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.removeAsa({
        sender,
        signer,
        args: { asset: asaId },
      })
    })
  }

  const addTrustedPeer = async () => {
    const peerAddress = mutationPeerInput.trim()
    if (!isValidAddress(peerAddress)) {
      enqueueSnackbar('Peer must be a valid Algorand address', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added peer ${peerAddress}`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedPeers({
        sender,
        signer,
        args: { peers: [peerAddress] },
      })
    })
  }

  const removeTrustedPeer = async () => {
    const peerAddress = mutationPeerInput.trim()
    if (!isValidAddress(peerAddress)) {
      enqueueSnackbar('Peer must be a valid Algorand address', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed peer ${peerAddress}`, async ({ appClient, sender, signer }) => {
      await appClient.send.removePeer({
        sender,
        signer,
        args: { peer: peerAddress },
      })
    })
  }

  return {
    isMutatingProfile,
    initProfile,
    addTrustedApp,
    removeTrustedApp,
    addTrustedAsa,
    removeTrustedAsa,
    addTrustedPeer,
    removeTrustedPeer,
  }
}
