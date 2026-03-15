import { algo } from '@algorandfoundation/algokit-utils'
import { getAccountFromEnvironment, getAlgorandClient } from './algorand'
import { scoreAppTrust, scoreAssetTrust } from './trustScoring'
import { VibecheckSdk } from './vibecheckSdk'

async function runDemo() {
  const algorand = getAlgorandClient()
  const deployer = await getAccountFromEnvironment(algorand, 'DEPLOYER')
  const deployerAddress = deployer.addr.toString()
  const sdk = new VibecheckSdk(algorand)

  const appClient = await sdk.deploy(deployerAddress)
  const reviewer = algorand.account.random()
  const reviewerAddress = reviewer.addr.toString()

  await algorand.send.payment({
    sender: deployerAddress,
    receiver: reviewerAddress,
    amount: algo(5),
  })

  const reviewerClient = sdk.getFactory(reviewerAddress).getAppClientById({ appId: appClient.appId })

  await sdk.initProfile(appClient, deployerAddress)
  await sdk.initProfile(reviewerClient, reviewerAddress)

  await sdk.addTrust(appClient, {
    sender: deployerAddress,
    appId: 42n,
    assetId: 31566704n,
    peer: reviewerAddress,
  })

  await sdk.addTrust(reviewerClient, {
    sender: reviewerAddress,
    appId: 42n,
  })

  const profiles = [
    await sdk.getProfile(appClient, deployerAddress, deployerAddress),
    await sdk.getProfile(appClient, reviewerAddress, deployerAddress),
  ]

  const appScore = scoreAppTrust({
    seedAccount: deployerAddress,
    targetAppId: 42n,
    profiles,
  })

  const assetScore = scoreAssetTrust({
    seedAccount: deployerAddress,
    targetAssetId: 31566704n,
    profiles,
  })

  console.log('=== Vibecheck demo complete ===')
  console.log(`App ID: ${appClient.appId}`)
  console.log(`Seed account: ${deployerAddress}`)
  console.log(`Peer account: ${reviewerAddress}`)
  console.log(`App trust score (target 42): ${appScore}`)
  console.log(`ASA trust score (target 31566704): ${assetScore}`)
}

runDemo().catch((error) => {
  console.error('Demo failed:', error)
  process.exitCode = 1
})
