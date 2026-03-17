import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { describe, expect, it } from 'vitest'
import { Vibecheck } from './contract.algo'

describe('Vibecheck contract', () => {
  const ctx = new TestExecutionContext()
  it('creates the contract instance', () => {
    const contract = ctx.contract.create(Vibecheck)
    expect(contract).toBeDefined()
  })
})
