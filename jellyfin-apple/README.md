# Marquee

A native Jellyfin client for iPhone, iPad and Apple TV. Free, no accounts, no ads. Built to feel
like Apple made it: system components, system player, system search, nothing invented.

> Working name. Renaming is a one-line change in `project.yml` plus the bundle identifier.

## What's here today

- **Connect and sign in** — type an address (bare hosts try `:8096` and HTTPS too), password or
  Quick Connect. Sessions live in the Keychain; the token is revalidated on launch.
- **Home** — Continue Watching, Next Up, and Recently Added per library.
- **Library** — every video library, sortable and filterable grids with paging.
- **Details** — movies and episodes with logo art, metadata, cast; series with an "Up Next"
  block, season picker and episode list.
- **Search** — debounced, cancellable, never mutates what you typed.
- **Playback** — `AVPlayerViewController` with direct play where the device can, HLS transcoding
  where it can't. Progress, pause and stop are reported to the server; PiP on iOS.

Everything is SwiftUI on iOS 26 and tvOS 26. One set of screens, platform metrics and
`#if os(tvOS)` for the handful of places the platforms differ (focus, toolbars, text entry).

## Getting started

```sh
brew install xcodegen
xcodegen generate
open Marquee.xcodeproj
```

Pick the `Marquee` (iOS) or `Marquee TV` scheme. The project file is generated and ignored by
git; `project.yml` is the source of truth. Set your team in Xcode's Signing tab or via
`DEVELOPMENT_TEAM` in `project.yml`.

Package tests run without Xcode's UI:

```sh
swift test --package-path Packages/JellyfinKit
```

## Layout

```
Packages/JellyfinKit/      Swift package: API client, models, endpoints, image URLs (tested)
Marquee/Shared/            App code shared by both targets
  App/                     Entry point, root, tabs, routes
  Session/                 Auth state, Keychain, device identity
  Services/                Library and playback services, image loading
  DesignSystem/            Metrics and formatters
  Components/              Cards, shelves, artwork, state views
  Features/                One folder per screen: Onboarding, Home, Library, Detail, Search, Player, Settings
Marquee/iOS, Marquee/tvOS  Assets and generated Info.plist per platform
docs/                      Architecture and roadmap
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit and
[docs/ROADMAP.md](docs/ROADMAP.md) for what's next, including Live TV.

## Status

Pre-alpha. The code has not yet been built against a device or simulator from this environment;
the first task on a Mac is `xcodegen generate` and a build of both schemes. Anything marked
`TODO:` in the source is a known gap.
