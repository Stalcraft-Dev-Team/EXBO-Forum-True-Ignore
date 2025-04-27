export enum MessagesTypes {
    Ping = 'ping',
    DeleteDiscussionsSubscribe = "deleteDiscussionsSubscribe",
    DeleteMessagesInDiscussions = "deleteMessagesInDiscussions",
    CollectIgnoredUsers = "collectIgnoredUsers",
}

export enum StorageKeys {
    HideDiscussions = "hideDiscussions",
    HideMessages = "hideMessages",
    HideNotifications = "hideNotifications",
    IgnoredUsers = "ignoredUsers",
}

export enum SwitchTypes {
    HideDiscussions = 0,
    HideMessages = 1,
    HideNotifications = 2,
}

export enum ClassTypes {
    HasEvent = "hasEvent",
    HideElement = "hideElement"
}