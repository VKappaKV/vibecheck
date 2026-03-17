import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils'
import { VibecheckFactory } from '../artifacts/vibecheck/VibecheckClient'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying Vibecheck ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(VibecheckFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({ onUpdate: 'append', onSchemaBreak: 'append' })

  // If app was just created fund the app account
  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })

    const payMbr = await algorand.createTransaction.payment({
      sender: deployer.addr,
      receiver: appClient.appAddress,
      amount: microAlgo(300_000),
    })

    await appClient.send.init({
      args: { payMbr },
    })
  }

  await appClient.send.addTrustedApps({
    args: { apps: [1n] },
  })

  const response = await appClient.send.getTrustedApp({
    args: { account: deployer.addr.toString() },
  })

  const trustedApps = (response.return ?? []).map((appId) => appId.toString())

  console.log(
    `Initialized ${appClient.appClient.appName} (${appClient.appClient.appId}) and added trusted app IDs: [${trustedApps.join(', ')}]`,
  )
}
