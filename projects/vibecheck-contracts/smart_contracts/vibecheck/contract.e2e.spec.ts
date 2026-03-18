import { Config, algo, microAlgo } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { Address } from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { VibecheckClient, VibecheckFactory } from '../artifacts/vibecheck/VibecheckClient'
import { TrustProfile, scoreAppTrust, scoreAssetTrust } from '../../utils/trustScoring'

const asAddressString = (address: Address | string) => address.toString()

describe('Vibecheck contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
      // traceAll: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(VibecheckFactory, {
      defaultSender: account,
    })

    const { appClient } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
    })
    return { client: appClient, factory }
  }

  const initProfile = async (client: VibecheckClient, sender: Address | string) => {
    const senderAddress = asAddressString(sender)
    const payMbr = await localnet.algorand.createTransaction.payment({
      sender: senderAddress,
      receiver: client.appAddress,
      amount: microAlgo(300_000),
    })

    await client.send.init({
      sender: senderAddress,
      args: { payMbr },
    })
  }

  const getProfile = async (
    client: VibecheckClient,
    account: Address | string,
    sender: Address | string,
  ): Promise<TrustProfile> => {
    const accountAddress = asAddressString(account)
    const senderAddress = asAddressString(sender)

    const trustedApps = await client.send.getTrustedApp({
      sender: senderAddress,
      args: { account: accountAddress },
    })

    const trustedAsas = await client.send.getTrustedAsa({
      sender: senderAddress,
      args: { account: accountAddress },
    })

    const trustedPeers = await client.send.getAdjacencyList({
      sender: senderAddress,
      args: { account: accountAddress },
    })

    return {
      account: accountAddress,
      trustedApps: trustedApps.return ?? [],
      trustedAsas: trustedAsas.return ?? [],
      trustedPeers: trustedPeers.return ?? [],
    }
  }

  test('initializes trust profile and returns empty lists', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await initProfile(client, testAccount)

    const profile = await getProfile(client, testAccount, testAccount)

    expect(profile.trustedApps).toEqual([])
    expect(profile.trustedAsas).toEqual([])
    expect(profile.trustedPeers).toEqual([])
  })

  test('adds trust edges once, then removes app, asa and peer independently', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const peerAccount = localnet.algorand.account.random()

    await initProfile(client, testAccount)

    await client.send.addTrustedApps({ args: { apps: [101n, 101n] } })
    await client.send.addTrustedAsas({ args: { assets: [202n, 202n] } })
    await client.send.addTrustedPeers({ args: { peers: [asAddressString(peerAccount.addr), asAddressString(peerAccount.addr)] } })

    await client.send.addTrustedApps({ args: { apps: [101n] } })
    await client.send.addTrustedAsas({ args: { assets: [202n] } })
    await client.send.addTrustedPeers({ args: { peers: [asAddressString(peerAccount.addr)] } })

    const afterAdd = await getProfile(client, testAccount, testAccount)
    expect(afterAdd.trustedApps).toEqual([101n])
    expect(afterAdd.trustedAsas).toEqual([202n])
    expect(afterAdd.trustedPeers).toEqual([asAddressString(peerAccount.addr)])

    await client.send.removeApp({ args: { app: 101n } })

    const afterAppRemove = await getProfile(client, testAccount, testAccount)
    expect(afterAppRemove.trustedApps).toEqual([])
    expect(afterAppRemove.trustedAsas).toEqual([202n])
    expect(afterAppRemove.trustedPeers).toEqual([asAddressString(peerAccount.addr)])

    await client.send.removeAsa({ args: { asset: 202n } })

    const afterAsaRemove = await getProfile(client, testAccount, testAccount)
    expect(afterAsaRemove.trustedApps).toEqual([])
    expect(afterAsaRemove.trustedAsas).toEqual([])
    expect(afterAsaRemove.trustedPeers).toEqual([asAddressString(peerAccount.addr)])

    await client.send.removePeer({ args: { peer: asAddressString(peerAccount.addr) } })

    const afterRemove = await getProfile(client, testAccount, testAccount)
    expect(afterRemove.trustedApps).toEqual([])
    expect(afterRemove.trustedAsas).toEqual([])
    expect(afterRemove.trustedPeers).toEqual([])
  })

  test('rejects batch add when profile is not initialized', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    await expect(
      client.send.addTrustedApps({
        args: {
          apps: [1n],
        },
      }),
    ).rejects.toThrow()
  })

  test('produces non-zero trust scores from two-node graph', async () => {
    const { testAccount } = localnet.context
    const { client, factory } = await deploy(testAccount)

    const peerAccount = localnet.algorand.account.random()
    await localnet.algorand.send.payment({
      sender: testAccount,
      receiver: peerAccount.addr,
      amount: algo(5),
    })

    const peerClient = factory.getAppClientById({
      appId: client.appId,
      defaultSender: peerAccount.addr,
    })

    await initProfile(client, testAccount)
    await initProfile(peerClient, peerAccount.addr)

    await client.send.addTrustedApps({ args: { apps: [42n] } })
    await client.send.addTrustedAsas({ args: { assets: [31566704n] } })
    await client.send.addTrustedPeers({ args: { peers: [asAddressString(peerAccount.addr)] } })

    await peerClient.send.addTrustedApps({ args: { apps: [42n] } })

    const profiles = [
      await getProfile(client, testAccount, testAccount),
      await getProfile(client, peerAccount.addr, testAccount),
    ]

    const appScore = scoreAppTrust({
      seedAccount: asAddressString(testAccount),
      targetAppId: 42n,
      profiles,
    })

    const assetScore = scoreAssetTrust({
      seedAccount: asAddressString(testAccount),
      targetAssetId: 31566704n,
      profiles,
    })

    expect(appScore).toBeGreaterThan(0)
    expect(assetScore).toBeGreaterThan(0)
  })
})
