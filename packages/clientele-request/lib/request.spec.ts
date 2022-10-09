import fetchMock from 'jest-fetch-mock'
import request from './request.js'

const fetch = fetchMock.default

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('cross-fetch', () => require('jest-fetch-mock'))

beforeEach(() => {
  fetch.mockReset()
})

describe('request()', () => {
  it('is a function', () => {
    expect(request).toBeInstanceOf(Function)
  })

  it('returns parsed JSON body', async () => {
    fetch.once(JSON.stringify({ data: 12345 }))
    const { data } = await request('http://hi.com')
    expect(data).toEqual({ data: 12345 })
  })

  it('parses route with params', async () => {
    await request('/orgs/{org}/repos', { org: 'octokit' })
    expect(fetch.mock.lastCall?.[0]).toBe('/orgs/octokit/repos')
  })
})

describe('request.create()', () => {
  it('is a function', () => {
    expect(request.create).toBeInstanceOf(Function)
  })

  it('appends url to baseUrl', async () => {
    const acmeRequest = request.create({ baseUrl: 'https://acme-inc.com' })
    await acmeRequest('/api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe('https://acme-inc.com/api/v3')
    await acmeRequest('api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe('https://acme-inc.com/api/v3')
  })
})
