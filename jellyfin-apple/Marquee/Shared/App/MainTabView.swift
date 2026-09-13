import SwiftUI

enum MainTab: Hashable {
    case home, library, search, settings
}

struct MainTabView: View {
    @State private var selection: MainTab = .home

    var body: some View {
        TabView(selection: $selection) {
            Tab("Home", systemImage: "house", value: .home) {
                RoutedStack { HomeView() }
            }
            Tab("Library", systemImage: "square.grid.2x2", value: .library) {
                RoutedStack { LibrariesView() }
            }
            Tab("Search", systemImage: "magnifyingglass", value: .search, role: .search) {
                RoutedStack { SearchView() }
            }
            #if os(tvOS)
            Tab("Settings", systemImage: "gearshape", value: .settings) {
                RoutedStack { SettingsView() }
            }
            #endif
        }
        #if os(iOS)
        .tabBarMinimizeBehavior(.onScrollDown)
        #endif
    }
}

/// A navigation stack that already knows how to render every `Route`.
struct RoutedStack<Root: View>: View {
    @ViewBuilder var root: () -> Root

    var body: some View {
        NavigationStack {
            root()
                .navigationDestination(for: Route.self) { route in
                    RouteView(route: route)
                }
        }
    }
}
