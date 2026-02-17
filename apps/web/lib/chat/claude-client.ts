import Anthropic from '@anthropic-ai/sdk'

/**
 * Claude API クライアントのシングルトン
 * サーバーサイドでのみ使用する
 */
const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic }

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic
}

/** Claude API のモデル名 */
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929'

/** メッセージの最大トークン数 */
export const MAX_TOKENS = 4096
