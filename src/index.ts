import fetch from 'isomorphic-unfetch'
import { ajax, AjaxConfig } from './utils/ajax'
import { EditSubscriptionData, StreamContent, StreamContentsData, SubscriptionListResponse, TagListResponse } from './types'

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
        _url.searchParams.forEach((value, key) => {
            _query.append(key, value)
        })
        _url.search = _query.toString()
        // 判断 authToken
        if (!this.authToken) {
            this.authToken = await this.clientLogin()
        }
        // 如果是 post 请求，判断 postToken
        if (method === 'POST' && !this.postToken) {
            this.postToken = await this.getPostToken(depth + 1)
        }

        const _headers = {
            'Content-Type': 'application/json',
            Authorization: `GoogleLogin auth=${this.authToken}`,
            Accept: 'application/json',
            ...headers,
        }

        let body = data
        if (['GET', 'HEAD'].includes(method)) {
            body = null
        } else {
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
        if (type && type.startsWith('text/')) {
            return response.text() as T
        }
        if (type && type.startsWith('multipart/form-data')) {
            return response.formData() as T
        }
        if (type && type.startsWith('application/octet-stream')) {
            return response.blob() as T
        }
        return response.arrayBuffer() as T
    }

    /**
     * API calls are authenticated using API tokens
     * API 调用使用 API 令牌进行身份验证
     *
     * @author CaoMeiYouRen
     * @date 2024-09-07
     */
    async clientLogin() {
        const url = '/accounts/ClientLogin'
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        const data = new URLSearchParams({
            Email: this.email,
            Passwd: this.password,
        })
        const response = await ajax<string>({
            baseURL: this.baseUrl,
            url,
            method: 'POST',
            headers,
            data,
        })
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
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
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
        const response = await this.makeApiRequest<string>({
            url: '/subscription/edit',
            method: 'POST',
            headers,
            data: body,
        })
        return response // OK
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
        const headers = {
            Accept: 'application/json',
        }
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
            headers,
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

}

