# Roadmap

## 0.1 — Library (in progress)

- [x] Connect, password sign in, Quick Connect
- [x] Home shelves (Continue Watching, Next Up, Recently Added)
- [x] Library grids with sort, filters and paging
- [x] Movie, episode and series detail
- [x] Search
- [x] Playback with progress reporting, PiP
- [ ] First build on device / simulator and fix-up pass
- [ ] App icon and Top Shelf artwork
- [ ] Audio and subtitle track selection (the system player exposes HLS tracks; direct play needs a menu)
- [ ] Streaming quality setting (Auto / fixed bitrates)
- [ ] Multiple servers and users
- [ ] Trailers, collections (box sets) polish, genres browse
- [ ] Skip intro / chapter markers (`ItemField.chapters` is already modelled)

## 0.2 — Live TV

Goal: a full cable-style guide, not a channel list.

- Channels: `LiveTv/Channels` with logos, favourites, number ordering
- Guide: `LiveTv/Programs` windowed by time; a horizontally scrolling EPG grid with a fixed channel
  column, a "now" line, and prefetching of the next window
- Watch: `LiveTv/LiveStreamFiles` / `PlaybackInfo` with `autoOpenLiveStream`; HLS via the same
  `PlaybackSession`, minus progress reporting
- Recordings and series timers
- tvOS: guide as a first-class tab; iOS: guide under Library or its own tab (decide with usage)

## Later

- Music libraries (system Now Playing, AirPlay)
- Photos
- Offline downloads on iOS
- Server-side "SyncPlay"
- Widgets and Top Shelf content on tvOS
