import {
  Account,
  BoxMap,
  Contract,
  Global,
  Txn,
  abimethod,
  arc4,
  assert,
  assertMatch,
  clone,
  gtxn,
  op,
  uint64,
} from '@algorandfoundation/algorand-typescript'

const COST_PER_BYTE: uint64 = 400
const COST_PER_BOX: uint64 = 2500
const MAX_BOX_SIZE: uint64 = 1024
const UINT64_BYTES_SIZE: uint64 = 8
const ADDRESS_BYTES_SIZE: uint64 = 32
const MAX_APP_ARGS: uint64 = 16
const MAX_APP_TOTAL_ARG_LEN: uint64 = 2048

export class Vibecheck extends Contract {
  public trustedApp = BoxMap<Account, arc4.DynamicArray<arc4.Uint64>>({ keyPrefix: 'trusted_app' })

  public trustedAsa = BoxMap<Account, arc4.DynamicArray<arc4.Uint64>>({ keyPrefix: 'trusted_asa' })

  public adjacencyList = BoxMap<Account, arc4.DynamicArray<arc4.Address>>({ keyPrefix: 'adjacency_list' })

  public init(payMbr: gtxn.PaymentTxn): void {
    const mbrToCover: uint64 =
      this.getBoxMbr(UINT64_BYTES_SIZE) + this.getBoxMbr(UINT64_BYTES_SIZE) + this.getBoxMbr(ADDRESS_BYTES_SIZE)

    assertMatch(
      payMbr,
      {
        receiver: Global.currentApplicationAddress,
        amount: { greaterThanEq: mbrToCover },
      },
      'payment to app account required for MBR',
    )

    assert(!this.trustedApp(Txn.sender).exists, 'profile already initialized')
    assert(!this.trustedAsa(Txn.sender).exists, 'profile already initialized')
    assert(!this.adjacencyList(Txn.sender).exists, 'profile already initialized')

    this.trustedApp(Txn.sender).value = new arc4.DynamicArray<arc4.Uint64>()
    this.trustedAsa(Txn.sender).value = new arc4.DynamicArray<arc4.Uint64>()
    this.adjacencyList(Txn.sender).value = new arc4.DynamicArray<arc4.Address>()
  }

  public addTrustedApps(apps: arc4.DynamicArray<arc4.Uint64>): void {
    this.assertSenderProfile()
    this.assertAppCallArgsWithinLimits()

    const trustedAppList = clone(this.trustedApp(Txn.sender).value)
    const maxLength = this.getMaxLength(UINT64_BYTES_SIZE)

    for (let i: uint64 = 0; i < apps.length; i += 1) {
      const app = apps[i]
      if (app !== new arc4.Uint64(0) && !this.containsUint64(trustedAppList, app)) {
        assert(trustedAppList.length < maxLength, 'max number of trusted applications reached')
        trustedAppList.push(app)
      }
    }

    this.trustedApp(Txn.sender).value = clone(trustedAppList)
  }

  public addTrustedAsas(assets: arc4.DynamicArray<arc4.Uint64>): void {
    this.assertSenderProfile()
    this.assertAppCallArgsWithinLimits()

    const trustedAsaList = clone(this.trustedAsa(Txn.sender).value)
    const maxLength = this.getMaxLength(UINT64_BYTES_SIZE)

    for (let i: uint64 = 0; i < assets.length; i += 1) {
      const asset = assets[i]
      if (asset !== new arc4.Uint64(0) && !this.containsUint64(trustedAsaList, asset)) {
        assert(trustedAsaList.length < maxLength, 'max number of trusted assets reached')
        trustedAsaList.push(asset)
      }
    }

    this.trustedAsa(Txn.sender).value = clone(trustedAsaList)
  }

  public addTrustedPeers(peers: arc4.DynamicArray<arc4.Address>): void {
    this.assertSenderProfile()
    this.assertAppCallArgsWithinLimits()

    const adjacency = clone(this.adjacencyList(Txn.sender).value)
    const maxLength = this.getMaxLength(ADDRESS_BYTES_SIZE)
    const zeroPeer = new arc4.Address(Global.zeroAddress)

    for (let i: uint64 = 0; i < peers.length; i += 1) {
      const peer = peers[i]
      if (peer !== zeroPeer && !this.containsAddress(adjacency, peer)) {
        assert(adjacency.length < maxLength, 'max number of trusted peers reached')
        adjacency.push(peer)
      }
    }

    this.adjacencyList(Txn.sender).value = clone(adjacency)
  }

  public removeApp(app: arc4.Uint64): void {
    this.assertSenderProfile()

    if (app === new arc4.Uint64(0)) {
      return
    }

    const trustedAppList = clone(this.trustedApp(Txn.sender).value)
    this.trustedApp(Txn.sender).value = clone(this.removeUint64(trustedAppList, app))
  }

  public removeAsa(asset: arc4.Uint64): void {
    this.assertSenderProfile()

    if (asset === new arc4.Uint64(0)) {
      return
    }

    const trustedAsaList = clone(this.trustedAsa(Txn.sender).value)
    this.trustedAsa(Txn.sender).value = clone(this.removeUint64(trustedAsaList, asset))
  }

  public removePeer(peer: arc4.Address): void {
    this.assertSenderProfile()

    if (peer === new arc4.Address(Global.zeroAddress)) {
      return
    }

    const adjacency = clone(this.adjacencyList(Txn.sender).value)
    this.adjacencyList(Txn.sender).value = clone(this.removeAddress(adjacency, peer))
  }

  @abimethod({ readonly: true })
  public getTrustedApp(account: Account): arc4.DynamicArray<arc4.Uint64> {
    if (!this.trustedApp(account).exists) {
      return new arc4.DynamicArray<arc4.Uint64>()
    }
    return clone(this.trustedApp(account).value)
  }

  @abimethod({ readonly: true })
  public getTrustedASA(account: Account): arc4.DynamicArray<arc4.Uint64> {
    if (!this.trustedAsa(account).exists) {
      return new arc4.DynamicArray<arc4.Uint64>()
    }
    return clone(this.trustedAsa(account).value)
  }

  @abimethod({ readonly: true })
  public getAdjacencyList(account: Account): arc4.DynamicArray<arc4.Address> {
    if (!this.adjacencyList(account).exists) {
      return new arc4.DynamicArray<arc4.Address>()
    }
    return clone(this.adjacencyList(account).value)
  }

  private assertSenderProfile(): void {
    assertMatch(this.trustedApp(Txn.sender), { exists: true }, 'trusted app list should exist, call init first')
    assertMatch(this.trustedAsa(Txn.sender), { exists: true }, 'trusted asset list should exist, call init first')
    assertMatch(this.adjacencyList(Txn.sender), { exists: true }, 'adjacency list should exist, call init first')
  }

  private assertAppCallArgsWithinLimits(): void {
    assert(Txn.numAppArgs <= MAX_APP_ARGS, 'too many app args')

    let totalArgBytes: uint64 = 0
    for (let i: uint64 = 0; i < Txn.numAppArgs; i += 1) {
      totalArgBytes += op.len(Txn.applicationArgs(i))
    }

    assert(totalArgBytes <= MAX_APP_TOTAL_ARG_LEN, 'app args exceed AVM total byte limit')
  }

  private containsUint64(values: arc4.DynamicArray<arc4.Uint64>, candidate: arc4.Uint64): boolean {
    for (let i: uint64 = 0; i < values.length; i += 1) {
      if (values[i] === candidate) {
        return true
      }
    }
    return false
  }

  private containsAddress(values: arc4.DynamicArray<arc4.Address>, candidate: arc4.Address): boolean {
    for (let i: uint64 = 0; i < values.length; i += 1) {
      if (values[i] === candidate) {
        return true
      }
    }
    return false
  }

  private removeUint64(values: arc4.DynamicArray<arc4.Uint64>, candidate: arc4.Uint64): arc4.DynamicArray<arc4.Uint64> {
    const next = new arc4.DynamicArray<arc4.Uint64>()
    for (let i: uint64 = 0; i < values.length; i += 1) {
      if (values[i] !== candidate) {
        next.push(values[i])
      }
    }
    return next
  }

  private removeAddress(
    values: arc4.DynamicArray<arc4.Address>,
    candidate: arc4.Address,
  ): arc4.DynamicArray<arc4.Address> {
    const next = new arc4.DynamicArray<arc4.Address>()
    for (let i: uint64 = 0; i < values.length; i += 1) {
      if (values[i] !== candidate) {
        next.push(values[i])
      }
    }
    return next
  }

  private getBoxMbr(itemSize: uint64): uint64 {
    return COST_PER_BYTE * itemSize + COST_PER_BOX
  }

  private getMaxLength(itemSize: uint64): uint64 {
    return MAX_BOX_SIZE / itemSize
  }
}
