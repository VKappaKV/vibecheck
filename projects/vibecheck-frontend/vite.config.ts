import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

function getPackageName(id: string): string {
  const normalized = id.replace(/\\/g, '/')
  const packagePath = normalized.split('node_modules/')[1] ?? ''
  const parts = packagePath.split('/')

  if (parts[0]?.startsWith('@')) {
    return `${parts[0]}/${parts[1] ?? ''}`
  }

  return parts[0] ?? 'vendor'
}

function getManualChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) {
    return undefined
  }

  const packageName = getPackageName(id)

  if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
    return 'react-vendor'
  }

  if (packageName === 'react-router' || packageName === 'react-router-dom') {
    return 'router-vendor'
  }

  if (packageName.startsWith('@radix-ui/')) {
    return 'radix-vendor'
  }

  if (packageName === 'lucide-react' || packageName === 'notistack') {
    return 'ui-vendor'
  }

  if (packageName.startsWith('@algorandfoundation/')) {
    return 'algokit-vendor'
  }

  if (
    packageName === 'algosdk' ||
    packageName.startsWith('@noble/') ||
    packageName === 'js-sha512' ||
    packageName === 'hi-base32' ||
    packageName === 'tweetnacl' ||
    packageName === 'tweetnacl-ts' ||
    packageName === 'bignumber.js' ||
    packageName === 'algorand-msgpack'
  ) {
    return 'algosdk-vendor'
  }

  if (packageName.startsWith('@txnlab/')) {
    return 'txnlab-wallet-vendor'
  }

  if (packageName.startsWith('@blockshake/')) {
    return 'defly-wallet-vendor'
  }

  if (packageName === 'lute-connect') {
    return 'lute-wallet-vendor'
  }

  if (packageName.startsWith('@walletconnect/')) {
    return 'walletconnect-vendor'
  }

  if (
    packageName === 'lottie-web' ||
    packageName === '@evanhahn/lottie-web-light'
  ) {
    return 'lottie-vendor'
  }

  if (packageName === 'qr-code-styling' || packageName === 'likecoin-qr-code-styling') {
    return 'qr-styling-vendor'
  }

  if (
    packageName.startsWith('@perawallet/') ||
    packageName === 'bowser' ||
    packageName === 'detect-browser' ||
    packageName === 'json-bigint' ||
    packageName === 'query-string' ||
    packageName === 'goober' ||
    packageName.startsWith('@tanstack/')
  ) {
    return 'pera-wallet-vendor'
  }

  if (
    packageName === 'elliptic' ||
    packageName === 'bn.js' ||
    packageName === 'brorand' ||
    packageName === 'hash.js' ||
    packageName === 'hmac-drbg' ||
    packageName === 'minimalistic-assert' ||
    packageName === 'minimalistic-crypto-utils'
  ) {
    return 'elliptic-vendor'
  }

  if (
    packageName === 'crypto-browserify' ||
    packageName === 'browserify-sign' ||
    packageName === 'browserify-rsa' ||
    packageName === 'browserify-cipher' ||
    packageName === 'browserify-aes' ||
    packageName === 'browserify-des' ||
    packageName === 'create-hash' ||
    packageName === 'create-hmac' ||
    packageName === 'create-ecdh' ||
    packageName === 'diffie-hellman' ||
    packageName === 'public-encrypt' ||
    packageName === 'pbkdf2' ||
    packageName === 'randombytes' ||
    packageName === 'randomfill' ||
    packageName === 'readable-stream' ||
    packageName === 'string_decoder' ||
    packageName === 'stream-browserify' ||
    packageName === 'hash-base' ||
    packageName === 'ripemd160' ||
    packageName === 'sha.js' ||
    packageName === 'des.js' ||
    packageName === 'parse-asn1' ||
    packageName === 'cipher-base' ||
    packageName === 'md5.js' ||
    packageName === 'inherits' ||
    packageName === 'vm-browserify' ||
    packageName === 'process-nextick-args' ||
    packageName === 'core-util-is' ||
    packageName === 'util-deprecate' ||
    packageName === 'to-buffer' ||
    packageName === 'buffer-xor' ||
    packageName === 'safe-buffer'
  ) {
    return 'crypto-polyfills-vendor'
  }

  if (packageName === 'vite-plugin-node-polyfills' || packageName === 'buffer' || packageName === 'process' || packageName === 'events' || packageName === 'util') {
    return 'polyfills-vendor'
  }

  return undefined
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
})
