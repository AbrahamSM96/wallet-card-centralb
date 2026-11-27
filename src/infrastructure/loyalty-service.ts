import { ClaimTokenManager } from '@/domain/loyalty/claim-token-manager'
import { LoyaltyService } from '@/domain/loyalty/loyalty-service'
import { PublicCodeGenerator } from '@/domain/loyalty/public-code-generator'
import { DrizzleLoyaltyUnitOfWork } from '@/infrastructure/db/repositories/drizzle-loyalty-unit-of-work'
import { scheduleAfterResponse } from '@/infrastructure/next-after-scheduler'
import { ServerLogger } from '@/infrastructure/server-logger'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'

export const loyaltyService = new LoyaltyService({
  claimTokens: new ClaimTokenManager(),
  logger: new ServerLogger(),
  publicCodes: new PublicCodeGenerator(),
  scheduler: scheduleAfterResponse,
  unitOfWork: new DrizzleLoyaltyUnitOfWork(),
  walletSync: new WalletSyncService(),
})
