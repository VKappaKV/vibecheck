import { microAlgo } from '@algorandfoundation/algokit-utils'
import type { AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client'
import { VibecheckClient, VibecheckFactory } from '../smart_contracts/artifacts/vibecheck/VibecheckClient'
import { DEFAULT_PROFILE_INIT_MBR_PAYMENT, ZERO_ADDRESS } from './algorand'
import { TrustProfile } from './trustScoring'

export interface AddTrustParams {
  sender: string
  appId?: bigint
  assetId?: bigint
  peer?: string
}

export interface RemoveTrustParams {
  sender: string
  appId?: bigint
  assetId?: bigint
  peer?: string
}

export class VibecheckSdk {
  constructor(private readonly algorand: AlgorandClient) {}

  public getFactory(defaultSender: string): VibecheckFactory {
    return this.algorand.client.getTypedAppFactory(VibecheckFactory, {
      defaultSender,
    })
  }

  public async deploy(defaultSender: string): Promise<VibecheckClient> {
    const factory = this.getFactory(defaultSender)
    const { appClient } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
    })

    return appClient
  }

  public async initProfile(client: VibecheckClient, sender: string, mbrPayment = DEFAULT_PROFILE_INIT_MBR_PAYMENT) {
    const payMbr = await this.algorand.createTransaction.payment({
      sender,
      receiver: client.appAddress,
      amount: microAlgo(mbrPayment),
    })

    return client.send.init({
      sender,
      args: { payMbr },
    })
  }

  public async addTrust(client: VibecheckClient, params: AddTrustParams) {
    return client.send.add({
      sender: params.sender,
      args: {
        app: params.appId ?? 0n,
        asset: params.assetId ?? 0n,
        peer: params.peer ?? ZERO_ADDRESS,
      },
    })
  }

  public async removeTrust(client: VibecheckClient, params: RemoveTrustParams) {
    return client.send.remove({
      sender: params.sender,
      args: {
        app: params.appId ?? 0n,
        asset: params.assetId ?? 0n,
        peer: params.peer ?? ZERO_ADDRESS,
      },
    })
  }

  public async getProfile(client: VibecheckClient, account: string, sender: string): Promise<TrustProfile> {
    const trustedApps = await client.send.getTrustedApp({
      sender,
      args: { account },
    })

    const trustedAsas = await client.send.getTrustedAsa({
      sender,
      args: { account },
    })

    const trustedPeers = await client.send.getAdjacencyList({
      sender,
      args: { account },
    })

    return {
      account,
      trustedApps: trustedApps.return ?? [],
      trustedAsas: trustedAsas.return ?? [],
      trustedPeers: trustedPeers.return ?? [],
    }
  }
}
