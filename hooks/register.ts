import type { Register } from 'claude-code'

type Tier = { model: string; effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'; label: string }

// Edit these to change what each difficulty level uses.
const SONNET = 'claude-sonnet-5-5'
const OPUS = 'claude-opus-5-5'
const TIERS: Record<string, Tier> = {
  easy: { model: SONNET, effort: 'low', label: 'Sonnet · low' },
  normal: { model: SONNET, effort: 'medium', label: 'Sonnet · medium' },
  hard: { model: OPUS, effort: 'high', label: 'Opus · high' },
  extreme: { model: OPUS, effort: 'max', label: 'Opus · max' },
}
const FALLBACK = 'normal'

const JUDGE = `You rate how hard a user's request to an AI coding/work assistant is.
Reply with exactly one word:
easy    - quick lookup, short factual answer, tiny edit, rename, chit-chat
normal  - typical task: write or fix a small function, draft an email, summarize, simple planning
hard    - multi-file changes, debugging a tricky bug, design tradeoffs, longer analysis or writing
extreme - architecture of a whole system, deep research, security review, math/logic puzzles, very large or ambiguous projects

Request:
`

export const register: Register = on => {
  const texts = new Map<string, string>() // turnId -> prompt text
  const picked = new Map<string, Tier>() // turnId -> decision

  on('turn.start', ($, e, next) => {
    texts.set(e.turnId, e.text)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    // Only steer the main conversation, never subagents.
    if (e.agentId !== undefined) return yield* next(e)

    let tier = picked.get(e.turnId)
    if (!tier) {
      const text = (texts.get(e.turnId) ?? '').trim()
      tier = TIERS[FALLBACK]!
      // Continuations with no typed prompt keep the session's own settings.
      if (text.length > 0) {
        const r = await $.model.complete({
          model: 'haiku',
          prompt: JUDGE + text.slice(0, 4000),
          effort: 'low',
          maxTokens: 8,
          timeoutMs: 6000,
        })
        if (r.isAnswered) {
          const word = r.text.trim().toLowerCase().split(/\W+/)[0] ?? ''
          tier = TIERS[word] ?? tier
        }
      } else {
        return yield* next(e)
      }
      picked.set(e.turnId, tier)
      texts.delete(e.turnId)
      $.ui.status(`auto: ${tier.label}`)
    }

    return yield* next({ ...e, model: tier.model, effort: tier.effort })
  })

  on('turn.complete', ($, e, next) => {
    picked.delete(e.turnId)
    return next(e)
  })
}
