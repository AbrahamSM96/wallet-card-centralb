import { exportPKCS8, generateKeyPair, jwtVerify } from 'jose'
import { describe, expect, it } from 'vitest'

import { GoogleWalletAuthClient } from './google-wallet-auth-client'

describe('GoogleWalletAuthClient', () => {
  it('signs an RS256 savetowallet JWT with the service account key', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256', {
      extractable: true,
    })
    const privateKeyPem = await exportPKCS8(privateKey)
    const auth = GoogleWalletAuthClient.for({
      client_email: 'wallet@example.iam.gserviceaccount.com',
      private_key: privateKeyPem,
    })
    const signedJwt = await auth.signSaveJwt(
      {
        loyaltyObjects: [{ classId: 'issuer.class', id: 'issuer.object' }],
      },
      ['https://example.com']
    )
    const { payload, protectedHeader } = await jwtVerify(signedJwt, publicKey, {
      audience: 'google',
      issuer: 'wallet@example.iam.gserviceaccount.com',
    })

    expect(protectedHeader.alg).toBe('RS256')
    expect(payload).toMatchObject({
      origins: ['https://example.com'],
      payload: {
        loyaltyObjects: [{ classId: 'issuer.class', id: 'issuer.object' }],
      },
      typ: 'savetowallet',
    })
  })
})
