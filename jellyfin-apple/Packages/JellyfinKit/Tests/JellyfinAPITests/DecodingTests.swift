import Foundation
import Testing
@testable import JellyfinAPI

@Suite("Decoding")
struct DecodingTests {
    let decoder = JSONCoding.makeDecoder()

    @Test("Decodes a BaseItem with PascalCase keys and image tags")
    func baseItem() throws {
        let json = """
        {
          "Name": "Heat", "Id": "m1", "Type": "Movie", "ProductionYear": 1995,
          "RunTimeTicks": 102000000000, "CommunityRating": 8.3,
          "ImageTags": {"Primary": "p1", "Logo": "l1"},
          "BackdropImageTags": ["b1"],
          "UserData": {"PlaybackPositionTicks": 51000000000, "Played": false, "IsFavorite": true},
          "PremiereDate": "1995-12-15T00:00:00.0000000Z",
          "Genres": ["Crime", "Drama"]
        }
        """
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(item.name == "Heat")
        #expect(item.type == .movie)
        #expect(item.imageTags[.primary] == "p1")
        #expect(item.imageTags[.logo] == "l1")
        #expect(item.backdropImageTags == ["b1"])
        #expect(item.isFavorite)
        #expect(item.canResume)
        #expect(item.userData?.resumeFraction(runTimeTicks: item.runTimeTicks) == 0.5)
        #expect(item.genres == ["Crime", "Drama"])
        #expect(item.premiereDate != nil)
        #expect(item.runTime == .seconds(10_200))
    }

    @Test("Unknown enum values decode to .unknown instead of failing")
    func lenientEnums() throws {
        let json = #"{"Id":"x","Name":"Thing","Type":"SomethingNew","CollectionType":"weird"}"#
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(item.type == .unknown)
        #expect(item.collectionType == .unknown)
    }

    @Test("Live TV item kinds match the server's actual Type strings")
    func liveTvItemKinds() throws {
        // The server's BaseItemKind serializes a channel as "TvChannel" but an EPG program as
        // plain "Program" (LiveTvProgram.GetClientTypeName() returns "Program", not "TvProgram").
        let channel = try decoder.decode(BaseItem.self, from: Data(#"{"Id":"c","Name":"Ch","Type":"TvChannel"}"#.utf8))
        let program = try decoder.decode(BaseItem.self, from: Data(#"{"Id":"p","Name":"Show","Type":"Program"}"#.utf8))
        #expect(channel.type == .liveTvChannel)
        #expect(program.type == .liveTvProgram)
    }

    @Test("Query results tolerate missing counts")
    func queryResult() throws {
        let json = #"{"Items":[{"Id":"a","Name":"A"}]}"#
        let result = try decoder.decode(QueryResult<BaseItem>.self, from: Data(json.utf8))
        #expect(result.items.count == 1)
        #expect(result.totalRecordCount == 1)
    }

    @Test("Parses Jellyfin's seven-digit fractional dates and plain dates")
    func dates() {
        #expect(JellyfinDate.parse("2024-03-01T10:15:30.1234567Z") != nil)
        #expect(JellyfinDate.parse("2024-03-01T10:15:30Z") != nil)
        #expect(JellyfinDate.parse("2024-03-01T10:15:30.5") != nil)
        #expect(JellyfinDate.parse("not a date") == nil)
    }

    @Test("Episode codes render as S·E")
    func episodeCode() throws {
        let json = #"{"Id":"e","Name":"Pilot","Type":"Episode","IndexNumber":1,"ParentIndexNumber":2}"#
        let item = try decoder.decode(BaseItem.self, from: Data(json.utf8))
        #expect(item.episodeCode == "S2 · E1")
    }
}
