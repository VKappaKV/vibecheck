import { microAlgo } from '@algorandfoundation/algokit-utils'
import type { AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client'
import { VibecheckClient, VibecheckFactory } from '../smart_contracts/artifacts/vibecheck/VibecheckClient'
import { DEFAULT_PROFILE_INIT_MBR_PAYMENT } from './algorand'
import { readProfileSnapshot } from './readProfileSnapshot'
import { TrustProfile } from './trustScoring'

export interface AddTrustParams {
  sender: string
  appIds?: bigint[]
  assetIds?: bigint[]
  peers?: string[]
}

export interface RemoveAppTrustParams {
  sender: string
  appId: bigint
}

export interface RemoveAsaTrustParams {
  sender: string
  assetId: bigint
}

export interface RemovePeerTrustParams {
  sender: string
  peer: string
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
    if ((params.appIds ?? []).length > 0) {
      await client.send.addTrustedApps({
        sender: params.sender,
        args: {
          apps: params.appIds ?? [],
        },
      })
    }

    if ((params.assetIds ?? []).length > 0) {
      await client.send.addTrustedAsas({
        sender: params.sender,
        args: {
          assets: params.assetIds ?? [],
        },
      })
    }

    if ((params.peers ?? []).length > 0) {
      await client.send.addTrustedPeers({
        sender: params.sender,
        args: {
          peers: params.peers ?? [],
        },
      })
    }
  }

  public async removeApp(client: VibecheckClient, params: RemoveAppTrustParams) {
    return client.send.removeApp({
      sender: params.sender,
      args: {
        app: params.appId,
      },
    })
  }

  public async removeAsa(client: VibecheckClient, params: RemoveAsaTrustParams) {
    return client.send.removeAsa({
      sender: params.sender,
      args: {
        asset: params.assetId,
      },
    })
  }

  public async removePeer(client: VibecheckClient, params: RemovePeerTrustParams) {
    return client.send.removePeer({
      sender: params.sender,
      args: {
        peer: params.peer,
      },
    })
  }

  public async getProfile(client: VibecheckClient, account: string, sender: string): Promise<TrustProfile> {
    return readProfileSnapshot(client, account, sender)
  }
}
