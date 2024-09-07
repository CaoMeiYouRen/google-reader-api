export interface UserInfo {
    userId: string
    userName: string
    userProfileId: string
    userEmail: string
}

export interface Subscription {
    title: string
    firstitemmsec: string
    htmlUrl: string
    sortid: string
    id: string
    categories: Category[]
}

export interface Category {
    id: string
    label: string
}

export interface SubscriptionListResponse {
    subscriptions: Subscription[]
}

// export interface EditSubscriptionData {
//     action: 'subscribe' | 'edit' | 'unsubscribe'
//     streamId: string
//     title?: string
//     categoryId?: string
// }

export interface CreateSubscription {
    action: 'subscribe'
    streamId: string
    title?: string
    categoryId?: string
}

export interface EditSubscription {
    action: 'edit'
    streamId: string
    title?: string
    categoryId?: string
    addCategory?: boolean
}

export interface DeleteSubscription {
    action: 'unsubscribe'
    streamId: string
}

export type EditSubscriptionData = CreateSubscription | EditSubscription | DeleteSubscription

export interface StreamContent {
    direction: string
    author: string
    title: string
    updated: number
    continuation: string
    id: string
    self: { href: string }[]
    items: StreamItem[]
}

export interface StreamItem {
    origin: any
    updated: number
    id: string
    categories: string[]
    author: string
    alternate: { href: string, type: string }[]
    timestampUsec: string
    content: { direction: string, content: string }
    crawlTimeMsec: string
    published: number
    title: string
}

export interface StreamContentsData {
    streamId: string
    // 排序条件。项目按日期排序（默认为降序），r=o 颠倒顺序
    sortCriteria?: 'o'
    // 每页的项数。默认值：20。
    itemsPerPage?: number
    // 用于分页。当 FeedHQ 返回页面时，它包含一个延续键，该键可以作为 c 参数传递以提取下一页。
    continuation?: string
    // 要从列表中排除的流 ID。
    excludeStreamId?: string
    // 要包含在列表中的 Steam ID。
    includeStreamId?: string
    // 早于此时间戳的项目将被筛选掉。
    olderThan?: number
    // 晚于此时间戳的项目将被筛选掉。
    newerThan?: number
}

export interface Tag {
    id: string
    sortid: string
}

export interface TagListResponse {
    tags: Tag[]
}

export interface Unreadcount {
    count: number
    id: string
    newestItemTimestampUsec: string
}

export interface UnreadCountResponse {
    max: number
    unreadcounts: Unreadcount[]
}

export interface QuickAddResponse {
    numResults: number
    query: string
    streamId: string
}

export interface itemRef {
    id: string
    directStreamIds?: string[]
}

export interface StreamItemsIdsResponse {
    itemRefs: itemRef[]
    continuation?: string
}

export type StreamItemIdsData = {
    includeAllDirectStreamIds?: boolean
} & Omit<StreamContentsData, 'sortCriteria'>

export interface StreamItemCountData {
    streamId: string
    includeLatestDate?: boolean
}

export interface StreamItemCountResponse {
    count: number
    date?: Date
}
