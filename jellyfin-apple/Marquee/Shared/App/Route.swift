import SwiftUI
import JellyfinAPI

/// Every push-navigable destination in the app. Views push values, never other views.
enum Route: Hashable {
    case item(BaseItem)
    case library(BaseItem)
    case person(Person)
}

struct RouteView: View {
    let route: Route

    var body: some View {
        switch route {
        case .item(let item):
            switch item.type {
            case .series:
                SeriesDetailView(series: item)
            case .season:
                SeriesDetailView(series: item, initialSeasonID: item.id)
            case .boxSet, .folder, .collectionFolder, .userView, .playlist:
                LibraryBrowseView(scope: .container(item))
            default:
                ItemDetailView(item: item)
            }
        case .library(let library):
            LibraryBrowseView(scope: .library(library))
        case .person(let person):
            LibraryBrowseView(scope: .person(person))
        }
    }
}
