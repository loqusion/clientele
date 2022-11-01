import fs from 'node:fs'
import { Agent } from 'node:http'
import { Stream } from 'node:stream'
import fetchMock from 'jest-fetch-mock'
import request from './request.js'

const fetch = fetchMock.default

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('cross-fetch', () => require('jest-fetch-mock'))

const baseUrl = 'https://api.clientelejs.com'
const jsonResponseInit = {
  status: 200,
  headers: {
    'content-type': 'application/json',
  },
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

beforeEach(() => {
  fetch.mockReset()
  fetch.mockResponse(() => Promise.resolve({ headers: {} }))
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('clientele request', () => {
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

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('accepts request timeout', async () => {
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

  it('terminates at an AbortController signal', async () => {
    jest.useFakeTimers()

    const controller = new AbortController()
    const signal = controller.signal

    fetch.once(async () => {
      controller.abort()
      await delay(3000)
      return {
        ...jsonResponseInit,
        body: JSON.stringify({ message: 'ok' }),
      }
    })

    const requestPromise = request(baseUrl, {}, { request: { signal } })
    jest.runAllTimers()

    await expect(requestPromise).rejects.toMatchObject({
      message: expect.stringMatching(
        /\bThe operation was aborted\b/i,
      ) as unknown,
    })
  })

  it('accepts custom fetch implementation', async () => {
    const customFetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            message: 'hi',
          }),
          jsonResponseInit,
        ),
      )

    const { data } = await request(
      baseUrl,
      {},
      {
        request: {
          fetch: customFetch,
        },
      },
    )
    expect(data).toEqual({ message: 'hi' })
  })

  it.todo('config.request.hook')

  it('accepts ReadStream data', async () => {
    const data = fs.createReadStream(__filename)
    await request(
      `POST ${baseUrl}/repos/{owner}/{repo}/releases/{release_id}/assets`,
      {},
      { data },
    )
    expect(fetch.mock.lastCall?.[1]).toHaveProperty(
      'body',
      expect.any(Stream.Readable),
    )
  })

  it('accepts Buffer data', async () => {
    const data = Buffer.from('Hello, world!\n')
    await request(
      `POST ${baseUrl}/repos/{owner}/{repo}/releases/{release_id}/assets`,
      {},
      { data },
    )
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('body', data)
  })

  it('accepts ArrayBuffer data', async () => {
    const stringToArrayBuffer = (str: string) => {
      const array = new Uint8Array(str.length)
      for (let i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i)
      }
      return array.buffer
    }

    const data = stringToArrayBuffer('Hello, World!\n')
    await request(
      `POST ${baseUrl}/repos/{owner}/{repo}/releases/{release_id}/assets`,
      {},
      { data },
    )
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('body', data)
  })

  it('sets request body directly with `data` option', async () => {
    const data = 'Hello world github/linguist#1 **cool**, and #1!'
    await request(
      `POST ${baseUrl}/markdown/raw`,
      {},
      {
        data,
        headers: {
          'content-type': 'text/plain',
        },
      },
    )
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('body', data)
  })

  it('performs simple string expansion', async () => {
    const params = {
      owner: 'loqusion',
      repo: 'clientelejs',
      path: 'path/to/file.txt',
    }
    const expectedUrl = `${baseUrl}/repos/${encodeURIComponent(
      params.owner,
    )}/${encodeURIComponent(params.repo)}/contents/${encodeURIComponent(
      params.path,
    )}`

    await request(`${baseUrl}/repos/{owner}/{repo}/contents/{path}`, params)
    expect(fetch.mock.lastCall?.[0]).toBe(expectedUrl)
    await request(`${baseUrl}/repos/:owner/:repo/contents/:path`, params)
    expect(fetch.mock.lastCall?.[0]).toBe(expectedUrl)
  })

  it('performs form-style query expansion', async () => {
    const params = {
      name: 'example.zip',
      label: 'short description',
    }

    await request(
      `POST ${baseUrl}/repos/octokat/Hello-World/releases/1/assets{?name,label}`,
      params,
    )
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/repos/octokat/Hello-World/releases/1/assets?name=${encodeURIComponent(
        params.name,
      )}&label=${encodeURIComponent(params.label)}`,
    )
  })

  it('percent-encodes reserved/non-ascii characters in query param', async () => {
    const params = {
      q: 'location:Jyväskylä',
    }

    await request(`${baseUrl}/search/issues{?q}`, params)
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/search/issues?q=${encodeURIComponent(params.q)}`,
    )
  })

  it('preserves existing query params when adding new ones', async () => {
    const url = `${baseUrl}/orgs/octokit/repos?access_token=abc4567`

    // NOTE: For now, {?query} expansion will always lead with `?`, even when there is already a `?` in the url.
    // This may change in the future.
    await request(`${url}{?type}`, { type: 'private' })
    expect(fetch.mock.lastCall?.[0]).toBe(`${url}?type=private`)
    await request(`${url}`, { type: 'private' })
    expect(fetch.mock.lastCall?.[0]).toBe(`${url}&type=private`)
  })

  it('ignores undefined variables in expansion', async () => {
    await request(`${baseUrl}/repos/{owner}/{repo}/contents/{path}`, {
      owner: 'loqusion',
      repo: undefined,
    })
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/repos/loqusion//contents/`,
    )
  })

  it.each(['GET', 'HEAD'])(
    'uses remaining params as query string in %s',
    async (method) => {
      const params = {
        name: 'example.zip',
        label: 'short description',
      }

      await request(
        `${method} ${baseUrl}/repos/octokat/Hello-World/releases/1/assets`,
        params,
      )
      expect(fetch.mock.lastCall?.[0]).toBe(
        `${baseUrl}/repos/octokat/Hello-World/releases/1/assets?name=${encodeURIComponent(
          params.name,
        )}&label=${encodeURIComponent(params.label)}`,
      )
    },
  )

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

  it('parses JSON response', async () => {
    const expectedData = {
      data: 12345,
      array: ['hello', 'world', 1985],
      nested: {
        data: 67890,
      },
    }
    fetch.once(JSON.stringify(expectedData), jsonResponseInit)
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

describe('clientele request.create()', () => {
  it('is a function', () => {
    expect(request.create).toBeInstanceOf(Function)
  })

  it.todo('sets defaults')

  it.todo('cascades defaults')
})

describe('clientele request instance', () => {
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
