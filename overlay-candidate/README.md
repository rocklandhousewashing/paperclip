# CO-593 compiled overlay candidate

This is an offline review artifact, not an installed release. The manifest binds
source parent `2828f1a0507d5ba8e05287fa0693c81a676313c8` to source child
`7b9e38b6326149596679cabc12bbf862bf294bb6`. Later artifact/handoff commits do not
change the runtime source child.

The tree contains all four TypeScript outputs for each of 12 changed runtime
modules (48 files). `manifest-draft.json` lists every path, SHA-256, installed
comparison digest, mode, package anchor, and the 10 additions to the existing
verifier's `ENTRY_PREFIXES`. `installed-runtime.diff` contains every JavaScript
and declaration difference. Maps are regenerated for the changed source positions.
`compatibility-report.json` records static import resolution against the installed
2026.916.1 package plus its existing overlay and this candidate; it does not claim
provider execution or a running service test.

Reproduce from this worktree with the existing offline dependencies, Node 24.21.0,
pnpm 9.15.4, and TypeScript 7.0.2:

```sh
pnpm install --offline --frozen-lockfile
pnpm --filter @paperclipai/plugin-sdk ensure-build-deps
pnpm --filter @paperclipai/shared exec tsc -p tsconfig.json
pnpm --filter @paperclipai/adapter-utils exec tsc -p tsconfig.json
pnpm --filter @paperclipai/adapter-claude-local exec tsc -p tsconfig.json
pnpm --filter @paperclipai/server exec tsc -p tsconfig.json
node overlay-candidate/assemble.mjs 7b9e38b6326149596679cabc12bbf862bf294bb6
node --experimental-import-meta-resolve overlay-candidate/verify-candidate.mjs
```

The assembly and verification scripts only read installed files and the existing
jarvis-system overlay/verifier. They write only this candidate directory. They
never import installed Paperclip modules, contact providers, or install files.
The existing live verifier intentionally rejects this draft schema and closure.
See `../HANDOFF-CO-593.md` for the required release change order and acceptance.
