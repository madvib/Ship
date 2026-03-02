+++
id = "6f56a448-82c4-402e-8c92-c48f96a33ab4"
title = "Release signing setup"
created = "2026-03-02T15:14:48.135169335Z"
updated = "2026-03-02T15:14:48.135169335Z"
tags = []
+++

# Release Signing Setup

## One-time keypair generation

```bash
cargo tauri signer generate -w ~/.tauri/shipwright.key
# → prints public key — paste into crates/ui/src-tauri/tauri.conf.json "pubkey" field
```

## GitHub Secrets (repo Settings → Secrets and variables → Actions)

### Required (updater signing)
| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | contents of `~/.tauri/shipwright.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | password you set (or empty string) |

### macOS code signing (requires Apple Developer — defer for now)
| Secret | Value |
|--------|-------|
| `APPLE_CERTIFICATE` | base64-encoded .p12 cert |
| `APPLE_CERTIFICATE_PASSWORD` | cert password |
| `APPLE_SIGNING_IDENTITY` | "Developer ID Application: Your Name (TEAMID)" |
| `APPLE_ID` | apple id email |
| `APPLE_PASSWORD` | app-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | team ID |

## Triggering a release

```bash
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
# → GitHub Action builds macOS arm64/x86_64 + Windows, creates draft release
```

## Skipping Apple Developer for alpha

Yes — omit the `APPLE_*` secrets entirely and remove the signing env vars from the workflow.
Tauri will still build and sign with the updater key. macOS users get a Gatekeeper warning
on first launch ("unidentified developer") and must right-click → Open to bypass it.
Totally acceptable for alpha/early access. Add notarization before public launch.

## After adding pubkey to tauri.conf.json

Commit the updated config — the pubkey is public, only the private key is secret.
