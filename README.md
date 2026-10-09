# auto-router

A Claude Code mod that picks the model and effort for each prompt.
A quick Haiku call rates the prompt (easy / normal / hard / extreme), then:

| Rating | Model | Effort |
|---|---|---|
| easy | Sonnet | low |
| normal | Sonnet | medium |
| hard | Opus | high |
| extreme | Opus | max |

Edit the `TIERS` block in `hooks/register.ts` to change this.

## Install
`/plugin install auto-router --marketplace DemeedS/claude-auto-router`
