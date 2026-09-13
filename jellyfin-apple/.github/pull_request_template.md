## What and why

<!-- What changed, and why. Link the issue this closes, e.g. "Closes #42". -->

## Checklist

- [ ] `xcodegen generate` run if `project.yml` or the file layout changed
- [ ] `swift test --package-path Packages/JellyfinKit` passes
- [ ] Both schemes build (`Marquee` on iOS Simulator, `Marquee TV` on tvOS Simulator)
- [ ] No new build warnings
- [ ] New `JellyfinKit` behaviour has a test
- [ ] Checked on both iOS and tvOS where the change touches shared UI — no layout glitches, focus
      traps, or truncation at typical iPhone/iPad/Apple TV sizes
- [ ] VoiceOver / focus-engine labels present on new interactive elements
- [ ] No stray `TODO`s without a `// TODO:` comment explaining the gap

## Screenshots / recording

<!-- For UI changes: iOS and tvOS, light and dark if relevant. Delete this section otherwise. -->
