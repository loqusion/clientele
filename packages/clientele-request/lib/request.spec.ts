import { Agent } from 'node:http'
import fetchMock from 'jest-fetch-mock'
import request from './request.js'

const fetch = fetchMock.default

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('cross-fetch', () => require('jest-fetch-mock'))

const baseUrl = 'https://api.clientelejs.com'

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

beforeEach(() => {
  fetch.mockReset()
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('request()', () => {
  it('is a function', () => {
    expect(request).toBeInstanceOf(Function)
  })

  it.each(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'])(
    'accepts %s method in route string',
    async (method) => {
      await request(`${method} ${baseUrl}`)
      expect(fetch.mock.lastCall?.[1]).toHaveProperty('method', method)
    },
  )

  it('defaults to GET when method is omitted from route string', async () => {
    await request(baseUrl)
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('method', 'GET')
  })

  it('passes headers to fetch', async () => {
    const headers = {
      test: 'test 123',
      'user-agent': 'amogus',
    }
    await request(baseUrl, {}, { headers })
    expect(fetch.mock.lastCall?.[1]).toHaveProperty(
      'headers',
      expect.objectContaining(headers),
    )
  })

  it('omits undefined headers', async () => {
    const headers = {
      'if-modified-since': undefined,
    }
    await request(baseUrl, {}, { headers })
    expect(fetch.mock.lastCall?.[1]).not.toHaveProperty(
      'headers.if-modified-since',
    )
  })

  it('converts uppercase header names to lowercase', async () => {
    const headers = {
      Authorization: 'token 12345',
      ETag: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
    }
    await request(baseUrl, {}, { headers })
    expect(fetch.mock.lastCall?.[1]).toHaveProperty(
      'headers',
      expect.objectContaining({
        authorization: 'token 12345',
        etag: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
      }),
    )
  })

  it('accepts request timeout', async () => {
    jest.useFakeTimers()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

    fetch.once(() =>
      delay(3000).then(() => ({
        status: 200,
        headers: {},
        body: JSON.stringify({ message: 'ok' }),
      })),
    )
    const requestPromise = request(baseUrl, {}, { request: { timeout: 100 } })
    jest.runAllTimers()

    await expect(requestPromise).rejects.toMatchObject({
      name: 'ClienteleRequestError',
      status: 500,
    })
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 100)
  })

  it('passes config.request.agent to fetch', async () => {
    await request(baseUrl, {}, { request: { agent: new Agent() } })
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('agent', expect.any(Agent))
  })

  it('config.request.signal', async () => {
    jest.useFakeTimers()

    const controller = new AbortController()
    const signal = controller.signal

    fetch.once(async () => {
      controller.abort()
      await delay(3000)
      return {
        status: 200,
        headers: {},
        body: JSON.stringify({ message: 'ok' }),
      }
    })

    const requestPromise = request(baseUrl, {}, { request: { signal } })
    jest.runAllTimers()

    await expect(requestPromise).rejects.toHaveProperty(
      'message',
      expect.stringMatching(/\b(signal|AbortSignal)\b/i),
    )
  })

  it('accepts custom fetch implementation', async () => {
    const customFetch = () =>
      Promise.resolve({
        data: JSON.stringify({ message: 'hi' }),
      })

    const { data } = await request(
      baseUrl,
      {},
      { request: { fetch: customFetch } },
    )
    expect(data).toBe({
      message: 'hi',
    })
  })

  it.todo('config.request.hook')

  it.todo('readstream data')
  it.todo('Buffer data')
  it.todo('ArrayBuffer data')

  it.todo('sets request body directly with `data` option')

  it('parses route with params', async () => {
    await request(`${baseUrl}/repos/{owner}/{repo}/contents/{path}`, {
      owner: 'loqusion',
      repo: 'clientelejs',
      path: 'path/to/file.txt',
    })
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/repos/loqusion/clientelejs/contents/path%2Fto%2Ffile.txt`,
    )
    await request(`${baseUrl}/repos/:owner/:repo/contents/:path`, {
      owner: 'loqusion',
      repo: 'clientelejs',
      path: 'path/to/file.txt',
    })
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/repos/loqusion/clientelejs/contents/path%2Fto%2Ffile.txt`,
    )
  })

  it.todo('parses route with query params')

  it.todo('percent-encodes reserved/non-ascii characters in query param')

  it.todo('preserves existing query params when adding new ones')

  it.todo('uses remaining params as query string in GET')

  it('uses remaining params in request body for POST', async () => {
    const params = {
      owner: 'octocat',
      repo: 'hello-world',
      title: 'Found a bug',
      body: "I'm having a problem with this.",
      assignees: ['octocat'],
      milestone: 1,
      labels: ['bug'],
    }
    await request(`POST ${baseUrl}`, params)
    expect(fetch).toHaveBeenLastCalledWith(
      baseUrl,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(params),
      }),
    )
  })

  it.todo('allows HEAD requests')

  it('parses JSON response', async () => {
    const expectedData = {
      data: 12345,
      array: ['hello', 'world', 1985],
      nested: {
        data: 67890,
      },
    }
    fetch.once(JSON.stringify(expectedData))
    const { data } = await request(baseUrl)
    expect(data).toEqual(expectedData)
  })

  it.todo('Request error')
  it.todo('304 etag')
  it.todo('304 last-modified')
  it.todo('404 not found')
  it.todo('422 error with details')
  it.todo('Not found')
  it.todo('non-JSON response')
  it.todo('accepts binary response')
  it.todo('redacts sensitive info from errors')
  it.todo('returns url')
})

describe('request.create()', () => {
  it('is a function', () => {
    expect(request.create).toBeInstanceOf(Function)
  })

  it.todo('sets defaults')

  it.todo('cascades defaults')
})

describe('request instance', () => {
  it('is a function', () => {
    const myRequest = request.create()
    expect(myRequest).toBeInstanceOf(Function)
  })

  it.todo('accepts omission of route')

  it('appends url to configured baseUrl', async () => {
    const myRequest = request.create({ baseUrl })
    await myRequest('/api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3`)
    await myRequest('api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3`)
    await myRequest('/api/v3/repos/{repo}', { repo: 'octocat' })
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3/repos/octocat`)
  })
})
