import fetch from 'isomorphic-unfetch'

export type Method =
    | 'GET'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'PURGE'
    | 'LINK'
    | 'UNLINK'

export interface AjaxConfig {
    url: string
    query?: Record<string, string> | string[][] | string | URLSearchParams
    data?: Record<string, unknown> | any
    method?: Method
    headers?: Record<string, string>
    baseURL?: string
    timeout?: number
}

/**
 * fetch 接口封装
 * @param config
 * @returns
 */
export async function ajax<T = any>(config: AjaxConfig): Promise<T> {
    try {
        const { url, query = {}, data = {}, method = 'GET', headers = {}, baseURL, timeout = 10000 } = config
        const _url = new URL(baseURL ? baseURL + url : url, baseURL)
        const _query = new URLSearchParams(query)
        _url.searchParams.forEach((value, key) => {
            _query.append(key, value)
        })
        _url.search = _query.toString()
        const _method = method.toUpperCase()
        let body = data
        if (['GET', 'HEAD'].includes(_method)) {
            body = null
        } else if (headers['Content-Type'] === 'application/json' || !headers['Content-Type']) {
            body = JSON.stringify(data)
        }
        return Promise.race([
            fetch(_url.toString(), {
                method: _method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body,
            }).then(async (res) => {
                if (!res.ok) {
                    console.error(await res.text())
                    throw new Error(`HTTP error! status: ${res.status}, statusText: ${res.statusText}`)
                }
                const type = res.headers.get('content-type')
                if (type && type.startsWith('application/json')) {
                    return res.json()
                }
                if (type && type.startsWith('text/')) {
                    return res.text()
                }
                if (type && type.startsWith('multipart/form-data')) {
                    return res.formData()
                }
                if (type && type.startsWith('application/octet-stream')) {
                    return res.blob()
                }
                return res.arrayBuffer()
            }),
            new Promise<void>((resolve, reject) => {
                setTimeout(() => reject(new Error('Ajax timeout!')), timeout)
            }),
        ])
    } catch (error) {
        console.error(error)
        throw error
    }
}
