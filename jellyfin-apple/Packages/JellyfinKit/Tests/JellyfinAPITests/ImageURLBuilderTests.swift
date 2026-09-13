import Foundation
import Testing
@testable import JellyfinAPI

@Suite("ImageURLBuilder")
struct ImageURLBuilderTests {
    let builder = ImageURLBuilder(serverURL: URL(string: "http://tv.local:8096")!)
    let decoder = JSONCoding.makeDecoder()

    @Test("Snaps widths to buckets so caches hit")
    func buckets() {
        #expect(ImageURLBuilder.bucketedWidth(100) == 160)
        #expect(ImageURLBuilder.bucketedWidth(160) == 160)
        #expect(ImageURLBuilder.bucketedWidth(161) == 240)
        #expect(ImageURLBuilder.bucketedWidth(9000) == 3840)
    }

    @Test("Episodes use the series poster and their own still")
    func episodeArtwork() throws {
        let json = #"{"Id":"e1","Name":"Ep","Type":"Episode","SeriesId":"s1","SeriesPrimaryImageTag":"sp","ImageTags":{"Primary":"still"}}"#
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(builder.poster(for: item, maxWidth: 300)?.absoluteString == "http://tv.local:8096/Items/s1/Images/Primary?tag=sp&quality=90&maxWidth=320")
        #expect(builder.landscape(for: item, maxWidth: 300)?.absoluteString == "http://tv.local:8096/Items/e1/Images/Primary?tag=still&quality=90&maxWidth=320")
    }

    @Test("Backdrops fall back to the parent's backdrop")
    func parentBackdrop() throws {
        let json = #"{"Id":"s","Name":"Season","Type":"Season","ParentBackdropItemId":"series","ParentBackdropImageTags":["bd"]}"#
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(builder.backdrop(for: item, maxWidth: 1920)?.path == "/Items/series/Images/Backdrop/0")
    }

    @Test("Missing tags produce no URL rather than a broken one")
    func missing() throws {
        let json = #"{"Id":"x","Name":"X","Type":"Movie"}"#
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(builder.poster(for: item, maxWidth: 300) == nil)
        #expect(builder.backdrop(for: item, maxWidth: 300) == nil)
    }
}
