import fetch from 'isomorphic-unfetch'
import { AjaxConfig } from './utils/ajax'
import { EditSubscriptionData, EditTagData, MarkAllAsReadData, QuickAddResponse, StreamContent, StreamContentsData, StreamItemContentsResponse, StreamItemCountData, StreamItemCountResponse, StreamItemIdsData, StreamItemsIdsResponse, SubscriptionListResponse, TagListResponse, UnreadCountResponse, UserInfo } from './types'

/**
 * Reference Documents/参考文档：https://feedhq.readthedocs.io/en/latest/api/reference.html
 *
 * @author CaoMeiYouRen
 * @date 2024-09-08
 * @export
 * @class GoogleReaderApi
 */
export class GoogleReaderApi {
    private email: string
    private password: string
    private baseUrl: string
    private apiBaseUrl: string
    private authToken: string
    private postToken: string

    /**
     * Creates an instance of GoogleReaderApi.
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param baseUrl eg. https://freshrss.example.net/api/greader.php
     * @param email eg. alice
     * @param password
     */
    constructor(baseUrl: string, email: string, password: string) {
        this.baseUrl = baseUrl
        this.apiBaseUrl = `${baseUrl}/reader/api/0`
        this.email = email
        this.password = password
    }

    async makeApiRequest<T = any>(config: AjaxConfig, depth = 0): Promise<T> {
        // 如果递归深度大于 3 ，则直接退出，避免死循环
        if (depth > 3) {
            throw new Error('Recursive depth greater than 3, forced exit')
        }
        const { url, query = {}, data = {}, headers = {}, method = 'GET', baseURL = this.apiBaseUrl, timeout = 10000 } = config
        const _url = new URL(baseURL ? baseURL + url : url, baseURL)
        const _query = new URLSearchParams(query)
        _url.search = _query.toString()
        if (url !== '/accounts/ClientLogin') {
            // 判断 authToken
            if (!this.authToken) {
                this.authToken = await this.clientLogin(depth + 1)
            }
            headers['Authorization'] = `GoogleLogin auth=${this.authToken}`
            // 如果是 post 请求，判断 postToken
            if (method === 'POST' && !this.postToken) {
                this.postToken = await this.getPostToken(depth + 1)
            }
        }

        const _headers = {
            // 'Content-Type': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            // Authorization: `GoogleLogin auth=${this.authToken}`,
            // Accept: 'application/json',
            ...headers,
        }

        let body = data
        if (['GET', 'HEAD'].includes(method)) {
            body = null
        } else if (_headers['Content-Type'] === 'application/json') {
            body = JSON.stringify(data)
        }

        const response: Response = await Promise.race([
            fetch(_url.toString(), {
                method,
                headers: _headers,
                body,
            }),
            new Promise<any>((resolve, reject) => {
                setTimeout(() => reject(new Error('Ajax timeout!')), timeout)
            }),
        ])

        if (!response.ok) {
            // console.log({
            //     url: _url.toString(),
            //     method,
            //     headers: _headers,
            //     body,
            // })
            console.error(await response.text())
            if (response.status === 401) {
                // 如果 401，且  X-Reader-Google-Bad-Token: true，则更新 postToken
                if (response.headers.get('x-reader-google-bad-token') === 'true') {
                    console.warn('POST token is invalid. Renewing token...')
                    this.postToken = await this.getPostToken(depth + 1)
                    if (!this.postToken) {
                        throw new Error('Failed to renew POST token')
                    }
                    return this.makeApiRequest<T>(config, depth + 1)
                }
                // 如果 401，则更新 authToken
                this.authToken = await this.clientLogin()
                if (!this.authToken) {
                    throw new Error('Failed to renew Auth token')
                }
                return this.makeApiRequest<T>(config, depth + 1)
            }
            throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
        }

        const type = response.headers.get('content-type')
        if (type && type.startsWith('application/json')) {
            return response.json() as T
        }
        if (type && (type.startsWith('text/') || type.startsWith('application/xml'))) {
            return response.text() as T
        }
        if (type && type.startsWith('multipart/form-data')) {
            return response.formData() as T
        }
        if (type && type.startsWith('application/octet-stream')) {
            return response.arrayBuffer() as T
        }
        return response.text() as T
    }

    /**
     * API calls are authenticated using API tokens
     * API 调用使用 API 令牌进行身份验证
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     */
    async clientLogin(depth = 0) {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        const data = new URLSearchParams({
            Email: this.email,
            Passwd: this.password,
        })
        const response = await this.makeApiRequest<string>({
            baseURL: this.baseUrl,
            url: '/accounts/ClientLogin',
            method: 'POST',
            headers,
            data,
        }, depth + 1)
        const authLine = response.split('\n').find((line) => line.startsWith('Auth='))
        if (!authLine) {
            throw new Error('AuthToken not found in response')
        }
        const authToken = authLine.split('=')[1]
        return authToken
    }

    /**
     * The POST token is a short-lived token that is used for CSRF protection. It must be included in request bodies as a T parameter.
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param [depth=0]
     */
    async getPostToken(depth = 0) {
        const postToken = await this.makeApiRequest<string>({
            url: '/token',
            method: 'GET',
        }, depth + 1)
        return postToken
    }

    /**
     * Returns various details about the user.
     * 返回有关用户的各种详细信息。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     */
    async getUserInfo() {
        const user = await this.makeApiRequest<string>({
            url: '/user-info',
            method: 'GET',
            query: {
                output: 'json',
            },
        })
        return JSON.parse(user) as UserInfo
    }

    /**
     * Returns all streams that have unread items, along with their unread count and the timestamp of their most recent item.
     * 返回具有未读项目的所有流，以及它们的未读计数和最新项目的时间戳
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     */
    async getUnreadCounts() {
        const response = await this.makeApiRequest<UnreadCountResponse>({
            url: '/unread-count',
            method: 'GET',
            query: {
                output: 'json',
            },
        })
        return response
    }

    /**
     * Deletes a category or a tag. Feeds that belong to the category being deleted are moved to the top-level.
     * 删除类别或标记。属于要删除的类别的源将移动到顶级。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param category
     */
    async disableTag(category: string | number) {
        const body = new URLSearchParams()
        body.append('T', this.postToken)
        if (typeof category === 'number') {
            body.append('s', category.toString())
        } else if (typeof category === 'string') {
            body.append('t', category)
        }
        const response = await this.makeApiRequest<'OK'>({
            url: '/disable-tag',
            method: 'POST',
            data: body,
        })
        return response // OK
    }

    /**
     * Renames a category. 重命名类别
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param category
     * @param newLabelName
     */
    async renameTag(category: string | number, newLabelName: string) {
        const body = new URLSearchParams()
        body.append('T', this.postToken)
        body.append('dest', newLabelName)
        if (typeof category === 'number') {
            body.append('s', category.toString())
        } else if (typeof category === 'string') {
            body.append('t', category)
        }
        const response = await this.makeApiRequest<'OK'>({
            url: '/rename-tag',
            method: 'POST',
            data: body,
        })
        return response // OK
    }

    /**
     * Lists all your subscriptions (feeds).
     * 列出您的所有订阅 （源）
     *
     * @author CaoMeiYouRen
     * @date 2024-09-06
     */
    async getSubscriptionList() {
        const { subscriptions } = await this.makeApiRequest<SubscriptionListResponse>({
            url: '/subscription/list',
            method: 'GET',
            query: {
                output: 'json',
            },
        })
        return subscriptions
    }

    /**
     * Creates, edits or deletes a subscription (feed).
     * 创建、编辑或删除订阅 （Feed）
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param data
     */
    async editSubscription(data: EditSubscriptionData) {
        const { action, streamId, title, categoryId, addCategory = true } = data as any
        const body = new URLSearchParams()
        body.append('ac', action)
        body.append('s', streamId)
        body.append('T', this.postToken)

        if (action === 'subscribe') {
            if (title) {
                body.append('t', title)
            }
            if (categoryId) {
                body.append('a', categoryId)
            }
        } else if (action === 'edit') {
            if (title) {
                body.append('t', title)
            }
            if (categoryId) {
                if (addCategory) {
                    // 将源添加到类别中
                    body.append('a', categoryId)
                } else {
                    // 将源移出类别
                    body.append('r', categoryId)
                }
            }
        }
        const response = await this.makeApiRequest<'OK'>({
            url: '/subscription/edit',
            method: 'POST',
            data: body,
        })
        return response // OK
    }

    /**
     * Adds a new subscription (feed), given only the feed’s URL.
     * 添加新订阅 （源），仅给定源的 URL。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param feedUrl
     */
    async quickAddSubscription(feedUrl: string) {
        const body = new URLSearchParams({
            quickadd: feedUrl,
            T: this.postToken,
        })
        const response = await this.makeApiRequest<QuickAddResponse>({
            url: '/subscription/quickadd',
            method: 'POST',
            data: body,
        })
        return response
    }

    /**
     * Returns the list of subscriptions in OPML (XML) format.
     * 返回 OPML （XML） 格式的订阅列表。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     */
    async exportSubscriptions() {
        const response = await this.makeApiRequest<string>({
            url: '/subscription/export',
        })
        return response
    }

    /**
     * Imports all subscriptions from an OPML file.
     * 从 OPML 文件导入所有订阅。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param opmlContent
     */
    async importSubscriptions(opmlContent: string) {
        const headers = {
            'Content-Type': 'text/xml',
        }
        const response = await this.makeApiRequest<string>({
            url: '/subscription/export',
            headers,
            method: 'POST',
            data: opmlContent,
        })
        return response
    }

    /**
     * Returns whether the user is subscribed to a given feed.
     * 返回用户是否订阅了给定的订阅源。
     * !FreshRSS 中未实现
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param streamId
     */
    async checkSubscription(streamId: string) {
        const response = await this.makeApiRequest<'true' | 'false'>({
            url: '/subscribed',
            query: {
                s: streamId,
            },
        })
        return response === 'true'
    }

    /**
     * Returns paginated, detailed items for a given stream.
     * 返回给定流的分页详细项目。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     * @param data
     */
    async getStreamContents(data: StreamContentsData) {
        const { streamId, sortCriteria, itemsPerPage, continuation, excludeStreamId, includeStreamId, olderThan, newerThan } = data
        const searchParams = new URLSearchParams()
        searchParams.append('output', 'json')
        if (sortCriteria) {
            searchParams.append('r', sortCriteria)
        }
        if (itemsPerPage) {
            searchParams.append('n', itemsPerPage.toString())
        }
        if (continuation) {
            searchParams.append('c', continuation)
        }
        if (excludeStreamId) {
            searchParams.append('xt', excludeStreamId)
        }
        if (includeStreamId) {
            searchParams.append('it', includeStreamId)
        }
        if (olderThan) {
            searchParams.append('ot', olderThan.toString())
        }
        if (newerThan) {
            searchParams.append('nt', newerThan.toString())
        }
        const response = await this.makeApiRequest<StreamContent>({
            url: `/stream/contents/${streamId}`,
            query: searchParams,
            method: 'GET',
        })
        return response
    }

    /**
     * Returns item IDs for a given stream ID.
     * 返回给定流 ID 的项目 ID。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param data
     */
    async getStreamItemIds(data: StreamItemIdsData) {
        const { streamId, includeAllDirectStreamIds, itemsPerPage, continuation, excludeStreamId, includeStreamId, olderThan, newerThan } = data
        const searchParams = new URLSearchParams()
        searchParams.append('output', 'json')
        searchParams.append('s', streamId)
        if (includeAllDirectStreamIds) {
            searchParams.append('includeAllDirectStreamIds', 'true')
        }
        if (itemsPerPage) {
            searchParams.append('n', itemsPerPage.toString())
        }
        if (continuation) {
            searchParams.append('c', continuation)
        }
        if (excludeStreamId) {
            searchParams.append('xt', excludeStreamId)
        }
        if (includeStreamId) {
            searchParams.append('it', includeStreamId)
        }
        if (olderThan) {
            searchParams.append('ot', olderThan.toString())
        }
        if (newerThan) {
            searchParams.append('nt', newerThan.toString())
        }
        const response = await this.makeApiRequest<string>({
            url: '/stream/items/ids',
            query: searchParams,
            method: 'GET',
        })
        return JSON.parse(response) as StreamItemsIdsResponse
    }

    /**
     * Returns the number of items in a given stream.
     * 返回给定流中的项目数。
     * !FreshRSS 中未实现
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param streamId
     * @param [includeLatestDate=false]
     */
    async getStreamItemCount(data: StreamItemCountData) {
        const { streamId, includeLatestDate = false } = data
        const searchParams = new URLSearchParams({
            s: streamId,
        })
        if (includeLatestDate) {
            searchParams.append('a', 'true')
        }
        const response = await this.makeApiRequest<string>({
            url: '/stream/items/count',
            query: searchParams,
            method: 'GET',
        })
        const [count, date] = response.split('#')
        return {
            count: parseInt(count),
            date: date ? new Date(date) : null,
        } as StreamItemCountResponse
    }

    /**
     * Returns the details about requested feed items.
     * 返回有关请求的源项的详细信息。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param itemIds
     */
    async getStreamItemContents(itemIds: string[]) {
        const body = new URLSearchParams()
        body.append('T', this.postToken)
        body.append('output', 'json')
        itemIds.forEach((i) => {
            body.append('i', i)
        })
        const response = await this.makeApiRequest<StreamItemContentsResponse>({
            url: '/stream/items/contents',
            method: 'POST',
            data: body,
        })
        return response
    }

    /**
     * Returns the list of special tags and labels.
     * 返回特殊标签和标签的列表
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     */
    async getTagList() {
        const { tags } = await this.makeApiRequest<TagListResponse>({
            url: '/tag/list',
            method: 'GET',
            query: {
                output: 'json',
            },
        })
        return tags
    }

    /**
     *  i: ID of the item to edit. Can be repeated to edit multiple items at once.
        i：要编辑的项的 ID。可以重复以一次编辑多个项目。
        a: tag to add to the items. Can be repeated to add multiple tags at once.
        A：标记以添加到项目中。可以重复以一次添加多个标签。
        r: tag to remove from the items. Can be repeated to remove multiple tags at once.
        r： 要从项目中删除的标签。可以重复此操作以一次删除多个标签。

        Possible tags are: 可能的标记包括：
        user/-/state/com.google/kept-unread
        user/-/state/com.google/starred
        user/-/state/com.google/broadcast
        user/-/state/com.google/read
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param data
     */
    async editTag(data: EditTagData) {
        const { editIds, addIds, removeIds } = data
        const body = new URLSearchParams()
        editIds?.forEach((id) => body.append('i', id))
        addIds?.forEach((tag) => body.append('a', tag))
        removeIds?.forEach((tag) => body.append('r', tag))
        const response = await this.makeApiRequest<'OK'>({
            url: '/edit-tag',
            method: 'POST',
            data: body,
        })
        return response
    }

    /**
     * Marks all items in a stream as read.
     * 将流中的所有项目标记为已读。
     *
     * @author CaoMeiYouRen
     * @date 2024-09-08
     * @param data
     */
    async markAllAsRead(data: MarkAllAsReadData) {
        const { streamId, timestampUsec } = data
        const body = new URLSearchParams()
        body.append('s', streamId)
        if (timestampUsec) {
            body.append('ts', timestampUsec.toString())
        }
        const response = await this.makeApiRequest<'OK'>({
            url: '/mark-all-as-read',
            method: 'POST',
            data: body,
        })
        return response
    }

}

