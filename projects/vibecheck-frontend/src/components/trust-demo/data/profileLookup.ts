interface NfdRecord {
  name?: string
  properties?: {
    userDefined?: {
      avatar?: string
    }
    verified?: {
      avatar?: string
    }
  }
}

interface NfdLookupResponse {
  [address: string]: NfdRecord | undefined
}

interface AccountLookupResponse {
  account?: {
    assets?: unknown[]
  }
}

function getRequestHeaders(token: unknown): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (typeof token === 'string') {
    const trimmed = token.trim()
    if (trimmed) {
      headers['X-Algo-API-Token'] = trimmed
    }

    return headers
  }

  if (token && typeof token === 'object') {
    for (const [key, value] of Object.entries(token)) {
      headers[key] = String(value)
    }
  }

  return headers
}

function getApiBaseUrl(server: string, port: number | string): string {
  const url = new URL(server)
  const nextPort = String(port)

  if (nextPort && !url.port && !((url.protocol === 'https:' && nextPort === '443') || (url.protocol === 'http:' && nextPort === '80'))) {
    url.port = nextPort
  }

  return url.toString().replace(/\/$/, '')
}

function getNfdLookupEndpoints(network: string): string[] {
  const normalized = network.toLowerCase()

  if (normalized.includes('local')) {
    return []
  }

  if (normalized.includes('testnet')) {
    return ['https://api.testnet.nf.domains', 'https://api.nf.domains']
  }

  if (normalized.includes('mainnet') || normalized.includes('production')) {
    return ['https://api.nf.domains']
  }

  return ['https://api.nf.domains']
}

interface FetchAsaOptInCountArgs {
  indexerServer: string
  indexerPort: string | number
  indexerToken: unknown
  address: string
}

export async function fetchAsaOptInCount({ indexerServer, indexerPort, indexerToken, address }: FetchAsaOptInCountArgs): Promise<number> {
  const baseUrl = getApiBaseUrl(indexerServer, indexerPort)
  const url = `${baseUrl}/v2/accounts/${encodeURIComponent(address)}`
  const response = await fetch(url, { headers: getRequestHeaders(indexerToken) })

  if (!response.ok) {
    throw new Error(`Unable to load account holdings (${response.status})`)
  }

  const data = (await response.json()) as AccountLookupResponse
  return data.account?.assets?.length ?? 0
}

export async function fetchNfdData(network: string, address: string): Promise<{ name: string; avatarUrl: string } | null> {
  const endpoints = getNfdLookupEndpoints(network)

  for (const endpoint of endpoints) {
    const url = `${endpoint}/nfd/lookup?address=${encodeURIComponent(address)}&view=thumbnail`

    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } })

      if (response.status === 404 || !response.ok) {
        continue
      }

      const payload = (await response.json()) as NfdLookupResponse
      const record = payload[address] ?? payload[address.toUpperCase()]

      if (!record?.name) {
        continue
      }

      return {
        name: record.name,
        avatarUrl: record.properties?.verified?.avatar ?? record.properties?.userDefined?.avatar ?? '',
      }
    } catch {
      continue
    }
  }

  return null
}
