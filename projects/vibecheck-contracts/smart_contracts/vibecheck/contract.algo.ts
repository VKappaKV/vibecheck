import { Contract } from '@algorandfoundation/algorand-typescript'

export class Vibecheck extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
