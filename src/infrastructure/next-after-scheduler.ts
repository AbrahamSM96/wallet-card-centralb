import type { PostCommitScheduler } from '@/domain/loyalty/wallet-provider'
import { after } from 'next/server'

/**
 * Registers post-commit work after the current Next.js response is sent.
 *
 * @param task - Asynchronous work kept alive by Next.js.
 */
export const scheduleAfterResponse: PostCommitScheduler = (task) => {
  after(task)
  return Promise.resolve()
}
