import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { isValidAddress } from 'algosdk'
import { useCallback, useState } from 'react'
import { VibecheckClient } from '../../../contracts/Vibecheck'
import { PROFILE_INIT_MBR } from '../constants'
import { parsePositiveBigInt } from '../utils/parsers'

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
  onChainAppClient: VibecheckClient | null
  mutationAppIdInput: string
  mutationAsaIdInput: string
  mutationPeerInput: string
  enqueueSnackbar: EnqueueSnackbar
  onMutationSuccess: () => void
}

interface RunIdMutationArgs {
  rawValue: string
  resourceLabel: 'APP' | 'ASA'
  successMessage: (resourceId: bigint) => string
  mutation: (context: OnChainClientContext, resourceId: bigint) => Promise<unknown>
}

export function useTrustProfileMutations({
  algorand,
  activeAddress,
  transactionSigner,
  onChainAppClient,
  mutationAppIdInput,
  mutationAsaIdInput,
  mutationPeerInput,
  enqueueSnackbar,
  onMutationSuccess,
}: UseTrustProfileMutationsArgs) {
  const [isMutatingProfile, setIsMutatingProfile] = useState<boolean>(false)

  const getOnChainClientContext = useCallback((): OnChainClientContext | null => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Connect a wallet before updating trust lists', { variant: 'warning' })
      return null
    }

    if (!onChainAppClient) {
      enqueueSnackbar('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.', { variant: 'error' })
      return null
    }

    return {
      appClient: onChainAppClient,
      sender: activeAddress,
      signer: transactionSigner,
    }
  }, [activeAddress, enqueueSnackbar, onChainAppClient, transactionSigner])

  const runProfileMutation = useCallback(
    async (successMessage: string, mutation: (context: OnChainClientContext) => Promise<unknown>) => {
      const context = getOnChainClientContext()
      if (!context) {
        return
      }

      setIsMutatingProfile(true)
      try {
        await mutation(context)
        enqueueSnackbar(`${successMessage}. Refresh the overview or network panel to load the latest on-chain state.`, {
          variant: 'success',
        })
        onMutationSuccess()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile update failed'
        enqueueSnackbar(message, { variant: 'error' })
      } finally {
        setIsMutatingProfile(false)
      }
    },
    [enqueueSnackbar, getOnChainClientContext, onMutationSuccess],
  )

  const runIdMutation = useCallback(
    async ({ rawValue, resourceLabel, successMessage, mutation }: RunIdMutationArgs) => {
      const resourceId = parsePositiveBigInt(rawValue.trim())
      if (!resourceId) {
        enqueueSnackbar(`${resourceLabel} id must be a positive integer`, { variant: 'error' })
        return
      }

      await runProfileMutation(successMessage(resourceId), (context) => mutation(context, resourceId))
    },
    [enqueueSnackbar, runProfileMutation],
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
    await runIdMutation({
      rawValue: mutationAppIdInput,
      resourceLabel: 'APP',
      successMessage: (appId) => `Added APP ${appId.toString()} to your trust list`,
      mutation: async ({ appClient, sender, signer }, appId) => {
        await appClient.send.addTrustedApps({
          sender,
          signer,
          args: { apps: [appId] },
        })
      },
    })
  }

  const removeTrustedApp = async () => {
    await runIdMutation({
      rawValue: mutationAppIdInput,
      resourceLabel: 'APP',
      successMessage: (appId) => `Removed APP ${appId.toString()} from your trust list`,
      mutation: async ({ appClient, sender, signer }, appId) => {
        await appClient.send.removeApp({
          sender,
          signer,
          args: { app: appId },
        })
      },
    })
  }

  const addTrustedAsa = async () => {
    await runIdMutation({
      rawValue: mutationAsaIdInput,
      resourceLabel: 'ASA',
      successMessage: (asaId) => `Added ASA ${asaId.toString()} to your trust list`,
      mutation: async ({ appClient, sender, signer }, asaId) => {
        await appClient.send.addTrustedAsas({
          sender,
          signer,
          args: { assets: [asaId] },
        })
      },
    })
  }

  const removeTrustedAsa = async () => {
    await runIdMutation({
      rawValue: mutationAsaIdInput,
      resourceLabel: 'ASA',
      successMessage: (asaId) => `Removed ASA ${asaId.toString()} from your trust list`,
      mutation: async ({ appClient, sender, signer }, asaId) => {
        await appClient.send.removeAsa({
          sender,
          signer,
          args: { asset: asaId },
        })
      },
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
