import dotenv from 'dotenv'
import { GoogleReaderApi } from '../src'

dotenv.config({})

let api: GoogleReaderApi

describe('GoogleReaderApi', () => {
    beforeAll(async () => {
        api = new GoogleReaderApi(process.env.BASE_URL || '', process.env.USER_EMAIL || '', process.env.USER_PASSWORD || '')
        await api.clientLogin()
    })

    test('Define api', () => {
        expect(api).toBeDefined()
    })

    test('getPostToken', async () => {
        const postToken = await api.getPostToken()
        expect(postToken).toEqual(expect.any(String))
        expect(postToken).toBeTruthy()
    })

    test('getUserInfo', async () => {
        const user = await api.getUserInfo()
        expect(user).toEqual({
            userId: expect.any(String),
            userName: expect.any(String),
            userProfileId: expect.any(String),
            userEmail: expect.any(String),
        })
    })

    test('getUnreadCounts', async () => {
        const unreadCounts = await api.getUnreadCounts()
        expect(unreadCounts.max).toEqual(expect.any(Number))
        expect(Array.isArray(unreadCounts.unreadcounts)).toBeTruthy()
    })

    test('getSubscriptionList', async () => {
        const subscriptions = await api.getSubscriptionList()
        expect(Array.isArray(subscriptions)).toBeTruthy()
    })

    test('exportSubscriptions', async () => {
        const response = await api.exportSubscriptions()
        expect(response).toEqual(expect.any(String))
    })

    test.skip('checkSubscription', async () => {
        const response = await api.checkSubscription('feed/38')
        expect(response).toEqual(expect.any(Boolean))
    })

    test('getStreamContents', async () => {
        const response = await api.getStreamContents({ streamId: 'feed/38' })
        expect(Array.isArray(response.items)).toBeTruthy()
        response.items = []
        expect(response).toEqual({
            id: expect.any(String),
            updated: expect.any(Number),
            continuation: expect.any(String),
            items: [],
        })
    })

    test('getStreamItemIds', async () => {
        const response = await api.getStreamItemIds({ streamId: 'feed/38' })
        expect(Array.isArray(response.itemRefs)).toBeTruthy()
        expect(response.continuation).toEqual(expect.any(String))
    })

    test.skip('getStreamItemCount', async () => {
        const response = await api.getStreamItemCount({ streamId: 'feed/38' })
        expect(response).toEqual({
            count: expect.any(Number),
        })
    })

    test('getStreamContents', async () => {
        const response = await api.getStreamItemContents(['tag:google.com,2005:reader/item/000611dccc92f672'])
        expect(Array.isArray(response.items)).toBeTruthy()
        response.items = []
        expect(response).toEqual({
            id: expect.any(String),
            updated: expect.any(Number),
            items: [],
        })
    })

    test('getTagList', async () => {
        const tags = await api.getTagList()
        expect(Array.isArray(tags)).toBeTruthy()
    })

})
