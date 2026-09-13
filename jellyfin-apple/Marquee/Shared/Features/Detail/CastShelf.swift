import SwiftUI
import JellyfinAPI

struct CastShelf: View {
    let people: [Person]
    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    private var cast: [Person] {
        let actors = people.filter { $0.type == "Actor" }
        return Array((actors.isEmpty ? people : actors).prefix(20))
    }

    var body: some View {
        if !cast.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Text("Cast")
                    .font(.title3.weight(.semibold))
                ScrollView(.horizontal) {
                    LazyHStack(alignment: .top, spacing: Metrics.shelfSpacing) {
                        ForEach(cast) { person in
                            PersonCard(person: person)
                        }
                    }
                    .padding(.vertical, Metrics.shelfLift)
                }
                .scrollIndicators(.hidden)
                .scrollClipDisabled()
                .padding(.vertical, -Metrics.shelfLift)
            }
        }
    }
}

struct PersonCard: View {
    let person: Person
    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        VStack(spacing: 6) {
            NavigationLink(value: Route.person(person)) {
                RemoteImage(url: session.images.person(person, maxWidth: Int(Metrics.personWidth * displayScale)))
                    .frame(width: Metrics.personWidth, height: Metrics.personWidth)
                    .overlay {
                        if person.primaryImageTag == nil {
                            Image(systemName: "person.fill")
                                .font(.title)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .clipShape(.circle)
            }
            .cardButtonStyle()
            Text(person.name)
                .font(.caption.weight(.medium))
                .lineLimit(1)
            if let role = person.role, !role.isEmpty {
                Text(role)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(width: Metrics.personWidth + 16)
        .accessibilityElement(children: .combine)
    }
}
