import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { describe, expect, it } from 'vitest'

import { ApplePassBuilder } from './apple-pass-builder'
import { ApplePassSigningClient } from './apple-pass-signing-client'

describe('ApplePassSigningClient', () => {
  it('signs a pkpass with certificates generated in the test', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'central-brownies-pass-'))
    try {
      generateCertificates(directory)
      const card: WalletCard = {
        accountName: 'Cliente Prueba',
        appleAuthToken: 'test-apple-auth-token',
        birthdayPromoActive: false,
        birthdayPromoText: 'Promo de cumpleaños',
        cardId: 'card-id',
        platform: 'apple',
        publicCode: 'CB-2345',
        referralUrl: 'https://example.com/r/CB-2345',
        rewardText: 'Brownie de regalo',
        stampCount: 2,
        stampsRequired: 10,
        status: 'active',
        storeLatitude: 20.1167,
        storeLongitude: -98.7469,
        storeName: 'Central Brownies',
        storeRelevantText: 'Estás cerca de Central Brownies',
      }
      const passJson = new ApplePassBuilder({
        appUrl: 'https://example.com',
        card,
        passTypeIdentifier: 'pass.com.example.central',
        teamIdentifier: 'TEAM123456',
      }).build()
      const signer = ApplePassSigningClient.for({
        apnsKey: 'unused',
        apnsKeyId: 'KEY1234567',
        appUrl: 'https://example.com',
        passCertificate: readFileSync(join(directory, 'signer.pem')),
        passKey: readFileSync(join(directory, 'signer.key')),
        passTypeIdentifier: 'pass.com.example.central',
        teamIdentifier: 'TEAM123456',
        wwdrCertificate: readFileSync(join(directory, 'wwdr.pem')),
      })

      const signedPass = await signer.sign(passJson)
      expect(signedPass.subarray(0, 2).toString()).toBe('PK')
      expect(signedPass.length).toBeGreaterThan(500)
      expect(signedPass.includes(Buffer.from('strip.png'))).toBe(true)
      expect(signedPass.includes(Buffer.from('strip@2x.png'))).toBe(true)
      expect(signedPass.includes(Buffer.from('strip@3x.png'))).toBe(true)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

/**
 * Generates a self-signed test CA and a signer certificate beneath it.
 *
 * @param directory - Temporary certificate directory.
 */
function generateCertificates(directory: string): void {
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      join(directory, 'wwdr.key'),
      '-out',
      join(directory, 'wwdr.pem'),
      '-subj',
      '/CN=WWDR Test',
      '-days',
      '1',
    ],
    { stdio: 'ignore' }
  )
  execFileSync(
    'openssl',
    [
      'req',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      join(directory, 'signer.key'),
      '-out',
      join(directory, 'signer.csr'),
      '-subj',
      '/CN=Pass Signer Test/OU=TEAM123456',
    ],
    { stdio: 'ignore' }
  )
  execFileSync(
    'openssl',
    [
      'x509',
      '-req',
      '-in',
      join(directory, 'signer.csr'),
      '-CA',
      join(directory, 'wwdr.pem'),
      '-CAkey',
      join(directory, 'wwdr.key'),
      '-CAcreateserial',
      '-out',
      join(directory, 'signer.pem'),
      '-days',
      '1',
    ],
    { stdio: 'ignore' }
  )
}
