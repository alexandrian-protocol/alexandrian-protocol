# Troubleshooting

## Vitest: one-line CJS deprecation notice

**Symptom:** When running `pnpm test:spec` or `pnpm test:integration` you may see:

```
The CJS build of Vite's Node API is deprecated. See https://vite.dev/...
```

**Cause:** Vitest loads Vite’s Node API; that single line is a deprecation notice, not a test failure.

**Impact:** None. Tests run and pass. For grant review or CI, treat the run as successful if the test summary shows all passed. (Future: we may upgrade to an ESM-only Vitest/Vite setup to remove the line.)

---

## Node 24: multiformats / CLI (ERR_PACKAGE_PATH_NOT_EXPORTED)

**Symptom:** After `pnpm build`, running `pnpm alex -- --help` (or the CLI in general) fails with:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in .../multiformats/package.json
```

Node 24’s stricter package resolution triggers this in the monorepo. **Use Node.js 20 LTS** (e.g. 20.19.0). The repo pins 20.19.0 in `.nvmrc` and `.node-version`. Run `nvm use` or `fnm use` after cloning so the CLI and all scripts run under Node 20.

---

## Windows: Hardhat test crash (UV_HANDLE_CLOSING)

**Symptom:** `pnpm test:protocol` fails with:

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
Exit status 3221226505
```

This is a known Node.js/libuv teardown issue on Windows. Hardhat has patched Windows teardown in several releases; the following often resolve it:

1. **Upgrade Node.js** — Use Node 22 LTS or current LTS. Older Node versions are more likely to hit this.
2. **Upgrade Hardhat** — With `"hardhat": "^2.28.0"` in root and `packages/protocol`, run `pnpm up hardhat` to update to the latest 2.x that satisfies the range. (pnpm does not allow `--latest` with a version spec like `@2`.)
3. **Run in WSL** — If the crash persists, run `pnpm test:protocol` from WSL2 (Linux) where the bug does not occur.
4. **Isolate the run** — Run only protocol tests: `pnpm test:protocol`. Avoid running Hardhat immediately after other heavy Node workloads in the same shell.

**Note:** Hardhat 2 does not accept Mocha’s `--exit` flag (HH305). We set `mocha: { exit: true }` in `packages/protocol/hardhat.config.cjs` so Mocha exits after tests; that may reduce the teardown window but does not always prevent the Windows assertion. If the crash persists, use Node 22 LTS or WSL. Contract tests can also be run in CI (Linux), which does not hit this Windows-specific assertion.

**For grant review:** If protocol tests *passed* and then the assertion appears, the run is still a success—the failure is in Node’s teardown, not in the protocol. Run `pnpm test:protocol` in WSL or rely on CI for clean output with zero assertion lines.

---

## Docker: "cannot find the file specified" / "unable to get image" (Windows)

**Symptom:** `docker compose -f docker/docker-compose.yml up --build` fails with:

```
unable to get image '...': error during connect: ... open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Cause:** Docker Desktop is not running, or the Docker engine hasn’t started. On Windows, the client talks to the daemon via the named pipe `dockerDesktopLinuxEngine`.

**Fix:** Start **Docker Desktop** and wait until it’s fully up (whale icon steady in the tray), then run the command again from the **repo root** (not from inside `docker/`).

**Path tip:** Always run from the repository root. If you `cd docker` first, the path `-f docker/docker-compose.yml` would look for `docker/docker/docker-compose.yml` and fail.

---

## Windows: clear terminal

**Symptom:** `clear` is not recognized.

**Fix:** On Windows Command Prompt use **`cls`**. In PowerShell you can use **`cls`** or **`Clear-Host`**. (`clear` is the Unix/macOS/Linux command.)
