import Foundation

public enum UserDataEndpoints {
    public static func markPlayed(userID: String, itemID: String) -> Endpoint<UserItemData> {
        Endpoint(.post, "Users/\(userID)/PlayedItems/\(itemID)")
    }

    public static func markUnplayed(userID: String, itemID: String) -> Endpoint<UserItemData> {
        Endpoint(.delete, "Users/\(userID)/PlayedItems/\(itemID)")
    }

    public static func markFavorite(userID: String, itemID: String) -> Endpoint<UserItemData> {
        Endpoint(.post, "Users/\(userID)/FavoriteItems/\(itemID)")
    }

    public static func unmarkFavorite(userID: String, itemID: String) -> Endpoint<UserItemData> {
        Endpoint(.delete, "Users/\(userID)/FavoriteItems/\(itemID)")
    }
}
