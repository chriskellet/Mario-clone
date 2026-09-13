import SwiftUI

/// Platform sizing in one place, so layouts read the same on both targets.
enum Metrics {
    #if os(tvOS)
    static let posterWidth: CGFloat = 200
    static let landscapeWidth: CGFloat = 340
    static let horizontalInset: CGFloat = 0
    static let shelfSpacing: CGFloat = 40
    static let shelfLift: CGFloat = 32
    static let sectionSpacing: CGFloat = 40
    static let cornerRadius: CGFloat = 12
    static let gridMinimum: CGFloat = 200
    static let gridSpacing: CGFloat = 40
    static let backdropHeight: CGFloat = 640
    static let episodeThumbWidth: CGFloat = 320
    static let personWidth: CGFloat = 160
    #else
    static let posterWidth: CGFloat = 116
    static let landscapeWidth: CGFloat = 220
    static let horizontalInset: CGFloat = 16
    static let shelfSpacing: CGFloat = 12
    static let shelfLift: CGFloat = 0
    static let sectionSpacing: CGFloat = 28
    static let cornerRadius: CGFloat = 10
    static let gridMinimum: CGFloat = 108
    static let gridSpacing: CGFloat = 12
    static let backdropHeight: CGFloat = 300
    static let episodeThumbWidth: CGFloat = 140
    static let personWidth: CGFloat = 88
    #endif

    static let posterAspect: CGFloat = 2 / 3
    static let landscapeAspect: CGFloat = 16 / 9
}
