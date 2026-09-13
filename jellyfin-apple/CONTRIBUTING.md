# Contributing

Marquee is a native Jellyfin client for iOS 26 and tvOS 26, built by Kedos Consulting Limited.
This document covers day-to-day workflow. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for
how the code fits together and [docs/ROADMAP.md](docs/ROADMAP.md) /
[docs/BACKLOG.md](docs/BACKLOG.md) for what's next.

## Getting set up

```sh
brew install xcodegen
xcodegen generate
open Marquee.xcodeproj
```

`Marquee.xcodeproj` is generated and gitignored; `project.yml` is the source of truth for
targets, settings and file lists. **Regenerate the project after any change to `project.yml` or
after adding/removing/renaming Swift files** — Xcode's file list comes from XcodeGen's globs, not
from `.pbxproj` edits.

Two schemes: `Marquee` (iOS) and `Marquee TV` (tvOS). Both must build before you open a PR.

## Running tests

`JellyfinKit` is a plain Swift package and tests run without Xcode:

```sh
swift test --package-path Packages/JellyfinKit
```

There is no app-target test suite yet — app-level logic (screen models, services) is exercised
through manual verification on both platforms. Anything you add to `JellyfinKit` (an endpoint, a
model, a decoding rule, `ServerAddress`/`Ticks`/`ImageURLBuilder` behaviour) needs a
`JellyfinAPITests` case alongside it; see `StubTransport` for faking the network.

CI (`.github/workflows/ci.yml`) runs `swift test`, then builds both schemes with
`xcodebuild build -destination generic/platform=iOS Simulator` and `tvOS Simulator`, code signing
off. It does not run the app or capture screenshots, so platform-specific visual regressions are
caught by hand, not by CI.

## Branch naming

`<type>/<short-slug>`, e.g. `feat/library-track-selection`, `fix/paging-off-by-one`,
`chore/xcodegen-bump`. Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`. Keep the slug a
few words; put detail in the commit message and PR description, not the branch name.

## Commit messages

Imperative subject line, ≤ 72 characters, no trailing period:

```
Add audio track selection menu for direct play

The system player only exposes track selection for HLS. Direct-played
files need our own menu, built from MediaSource.mediaStreams, so the
same gesture works regardless of play method.
```

- Subject: what the commit does ("Add", "Fix", "Rename", not "Added" or "Adds").
- Body: why, not what — the diff already shows what changed. Explain the constraint, the
  trade-off, or the bug being fixed. Wrap prose at roughly 72–80 columns.
- Reference an issue when one exists (`Refs #42`, `Fixes #42`).
- One logical change per commit. Rebase/squash fixup commits before opening a PR.

## Coding conventions

These match what's already in the tree — read a neighbouring file in the same folder before
guessing.

- **Interfaces first.** Screens depend on protocols (`LibraryServicing`, `PlaybackServicing`),
  never directly on `JellyfinClient`. A `Jellyfin*Service` struct is the thin adapter; write a
  stub conforming to the same protocol for previews or tests instead of hitting the network.
- **One model per screen.** A screen's `@Observable` class owns its loading state and mutations
  (see `HomeModel`, `LibraryBrowseModel`, `ItemDetailModel`). Views render state and forward
  intent; they don't call services directly.
- **Small, focused methods.** A method does one thing — one network call, one transform, one
  piece of state. Split before a method grows past a screen's worth of code, and prefer several
  small `private func`s over one that branches heavily (see `PlaybackSession`'s `tick()` /
  `didPlayToEnd()` / `attachArtwork()` split).
- **Domain folders, not layer folders.** Each `Features/<Name>/` folder holds its model and
  views together. Promote something into `Components/` only once two features need it.
- **No custom controls when a system one exists.** Tab bar, navigation, search, buttons, lists,
  the player — use SwiftUI/UIKit's own. A hand-rolled control is a design smell unless the system
  genuinely has no equivalent (as with `Metrics`-driven grid/shelf layouts).
- **`Metrics` for platform sizing.** Numeric layout constants that differ by platform live in
  `DesignSystem/Metrics.swift` behind `#if os(tvOS)`, not scattered `#if os(tvOS)` blocks in
  views. Add to `Metrics` rather than hardcoding a new magic number in a view.
- **`// TODO:` for anything non-production.** A stub, a deferred setting, a known gap — mark it
  `// TODO:` with enough context to act on later (see `PlaybackService.maxStreamingBitrate`,
  `HomeModel`'s library TODO). Don't leave silent gaps or half-finished branches without one.
- **Swift 6 strict concurrency.** Both the package and the app build in Swift 6 language mode.
  Model types crossing actor boundaries are `Sendable`; `JellyfinClient` is an actor; app state
  that touches the UI is `@MainActor`. Fix concurrency warnings, don't `@unchecked Sendable` your
  way past them without a comment explaining why it's safe.
- **British English in user-facing copy and prose docs** (this repo is UK-owned); API identifiers
  follow Jellyfin's own naming (e.g. `Favorite`, `Recommended` in endpoint/field names) even where
  that's US spelling.

## Accessibility

Every interactive element needs a meaningful accessibility label — VoiceOver on iOS and the
focus-engine narration on tvOS both depend on it. Icon-only buttons (favourite, play, sort/filter
menus) need `.accessibilityLabel`; grouped card content needs `.accessibilityElement(children:)` +
a combined label so VoiceOver doesn't read artwork, title and metadata as three stops. Check both
platforms — tvOS focus narration and iOS VoiceOver read state differently even from the same
view.

## Pull request checklist

Before opening a PR, confirm:

- [ ] `xcodegen generate` run if `project.yml` or the file layout changed
- [ ] `swift test --package-path Packages/JellyfinKit` passes
- [ ] Both schemes build (`Marquee` on iOS Simulator, `Marquee TV` on tvOS Simulator)
- [ ] No new build warnings
- [ ] New `JellyfinKit` behaviour has a test
- [ ] Checked on both iOS and tvOS where the change touches shared UI — no layout glitches,
      focus traps, or truncation at typical iPhone/iPad/Apple TV sizes
- [ ] VoiceOver / focus-engine labels present on new interactive elements
- [ ] No stray `TODO`s without a `// TODO:` comment explaining the gap
- [ ] PR description says what changed and why, and links the issue it closes

Use the PR template (`.github/pull_request_template.md`) — it mirrors this list.

## Filing issues

Use the bug report or feature request form under **New Issue**. Include the platform (iOS/tvOS),
Jellyfin server version and playback method for anything playback-related — see
`.github/ISSUE_TEMPLATE/`.
