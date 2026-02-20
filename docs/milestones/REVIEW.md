# Reviewer notes (M1)

Short checklist and troubleshooting so reviewers get a smooth first run.

---

## Before you run anything

1. **Node version** — Use **Node.js 20 LTS** (20.19.0 recommended). The repo pins this in `.nvmrc` and `.node-version`. Run `nvm use` or `fnm use` in the repo root after cloning.
2. **Why not Node 24?** — Node 24 has a known multiformats resolution issue in this monorepo. You may see `ERR_PACKAGE_PATH_NOT_EXPORTED` when running `pnpm alex -- --help` or other CLI/import paths. Using Node 20 avoids this and gives a consistent experience.

---

## Troubleshooting

- **`ERR_PACKAGE_PATH_NOT_EXPORTED` (multiformats)** — You’re likely on Node 24. Switch to Node 20 LTS.
- **`pnpm alex publish ...` does nothing / wrong error** — Use the double-dash: `pnpm alex -- publish ...`. The `--` is required so arguments are passed to the CLI. Copy-paste exactly as in milestones/README.
- **Hardhat crash on Windows (UV_HANDLE_CLOSING)** — CI runs on Linux and is unaffected. If tests *passed* and then the assertion appears, the run is still a success.
- **One-line Vite CJS deprecation** — If you see "The CJS build of Vite's Node API is deprecated," it’s harmless. Tests are unaffected.

Full troubleshooting and command list: see [CONTRIBUTING](../../CONTRIBUTING.md).
