import { test, expect } from 'claude-code/testing'

async function run($: any, on: any, verdict: string) {
  on('model.complete', () => ({ value: { isAnswered: true, text: verdict, usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }))
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  let seen: any
  on('turn.step', async function* (_$: any, e: any) { seen = e; return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] } })
  await $.turn.start({ text: 'design the whole system', turnId: 't1' })
  const s = $.turn.step({ turnId: 't1', index: 0, model: 'x', messageCount: 1 })
  for await (const _ of s) { /* drain */ }
  return seen
}

test('hard prompts go to Opus max', async ($, on) => {
  const seen = await run($, on, 'extreme')
  expect(seen.model).toBe('claude-opus-5-5')
  expect(seen.effort).toBe('max')
})

test('easy prompts stay on Sonnet low', async ($, on) => {
  const seen = await run($, on, 'easy')
  expect(seen.model).toBe('claude-sonnet-5-5')
  expect(seen.effort).toBe('low')
})
