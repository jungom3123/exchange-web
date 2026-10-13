# Anti-slop vendored installation

Installed on 2026-10-13 using the local `install-anti-slop` skill's
`scripts/install.mjs` (without `--force`).

## Source identity

- Source bundle: `C:/Users/Administrator/.codex/skills/install-anti-slop/assets/anti-slop`.
- Anti-slop source repository: **unknown**; the installed skill provides no verified repository metadata.
- Anti-slop upstream commit: **unknown**; the source bundle is not a Git checkout and has no root revision record.
- The nested Stylistic source has its own provenance in `vendor/eslint-stylistic/UPSTREAM.md`.
  Its revision identifies that adapted rule's origin, not the whole anti-slop bundle.
- `SNAPSHOT.sha256` identifies every file copied from the skill. All copied files were
  verified byte-for-byte against the local source bundle at installation.

## Recoverable pristine baseline

The first Git commit adding this file contains the unmodified installed bundle.
Find it with:

```sh
git log --diff-filter=A --format=%H -- tools/oxlint/anti-slop/UPSTREAM.md
```

Recover the files at that revision with `git archive <revision> tools/oxlint/anti-slop`.
Use the paths in `SNAPSHOT.sha256` to distinguish bundled files from this repository's
installation records. `.gitattributes` disables line-ending conversion only for this
vendored tree so the snapshot remains byte-for-byte recoverable.

## Installed paths and configuration

- Generic entry point: `tools/oxlint/anti-slop/index.ts`.
- Optional Effect entry point: `tools/oxlint/anti-slop/effect/index.ts` (copied, not enabled;
  this project has no direct `effect` dependency).
- Oxlint configuration: `.oxlintrc.json`; all 18 generic custom rules and native
  `oxc/no-accumulating-spread` are enabled as errors.
- Runtime pair: `oxlint` and `@oxlint/plugins`, both pinned to `1.87.0`.
- Nested `vendor/eslint-stylistic/LICENSE` and `UPSTREAM.md` are retained unchanged.

## Intentional deviations

None in copied rule implementations, helpers, diagnostics, or nested vendor files.
This root `UPSTREAM.md` and `SNAPSHOT.sha256` are repository-owned installation records.
No bundled rule tests were supplied by this skill snapshot; do not interpret references
to tests in nested upstream documentation as files present in this installation.

At installation, existing application lint findings were reported without autofix or
rule suppression. The application cleanup on 2026-10-13 resolves those findings;
copied plugin sources, rule severities, and ignore patterns remain unchanged.
