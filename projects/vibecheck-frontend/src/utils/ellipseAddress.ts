export function ellipseAddress(address: string | null, width = 6): string {
  if (!address) {
    return address ?? ''
  }

  if (address.length <= width * 2) {
    return address
  }

  return `${address.slice(0, width)}...${address.slice(-width)}`
}
