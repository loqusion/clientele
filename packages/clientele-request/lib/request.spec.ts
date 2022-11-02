import fs from 'node:fs'
import { Agent } from 'node:http'
import { Stream } from 'node:stream'
import fetchMock from 'jest-fetch-mock'
import type { PartialDeep } from 'type-fest'
import request from './request.js'
import { HttpStatusCode } from './types.js'
import type RequestError from './request-error.js'

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

  it('uppercases methods', async () => {
    await request(`put ${baseUrl}`)
    expect(fetch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'PUT' }),
    )

    await request(`${baseUrl}`, {}, { method: 'put' as 'PUT' })
    expect(fetch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('accepts method in config', async () => {
    const method = 'PUT'
    await request(baseUrl, {}, { method })
    expect(fetch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ method }),
    )
  })

  it('rejects empty url', async () => {
    await expect(request('')).rejects.toBeDefined()
  })

  it('trims redundant slashes between baseUrl and url', async () => {
    await request(
      '/repos/loqusion/clientele/issues',
      {},
      {
        baseUrl: `https://github.com/api/v2/`,
      },
    )
    expect(fetch).toHaveBeenLastCalledWith(
      'https://github.com/api/v2/repos/loqusion/clientele/issues',
      expect.anything(),
    )
  })

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

    await expect(requestPromise).rejects.toMatchObject<Partial<RequestError>>({
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

    await expect(requestPromise).rejects.toMatchObject<Partial<RequestError>>({
      message: expect.stringMatching(
        /\bThe operation was aborted\b/i,
      ) as string,
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

  it('returns url', async () => {
    fetch.once((req) => Promise.resolve({ url: req.url }))
    const expectedUrl = `${baseUrl}/api/v2/status.json`
    const { url } = await request(expectedUrl)
    expect(url).toBe(expectedUrl)
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

  it('returns non-JSON response', async () => {
    const body = '# hello-world'
    fetch.once(() =>
      Promise.resolve({
        status: HttpStatusCode.Ok,
        body,
        headers: {
          'content-length': '13',
          'content-type': 'application/vnd.github.v3.raw; charset=utf-8',
        },
      }),
    )

    const { data } = await request(
      `GET ${baseUrl}/repos/octokit-fixture-org/hello-world/contents/README.md`,
    )
    expect(data).toBe(body)
  })

  it('returns binary response', async () => {
    const body = Buffer.from(
      '1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000',
      'hex',
    )
    fetch.once(() =>
      Promise.resolve({
        status: HttpStatusCode.Ok,
        // workaround
        body: body as unknown as string,
        headers: {
          'content-type': 'application/x-gzip',
          'content-length': `${body.byteLength}`,
        },
      }),
    )

    const { data } = (await request(
      'GET https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master',
    )) as { data: ArrayBuffer }
    const dataView = new Uint8Array(data)

    expect(body.equals(dataView)).toBe(true)
  })

  it('returns undefined data for 204 NoContent', async () => {
    fetch.once(() => Promise.resolve({ status: HttpStatusCode.NoContent }))
    const { status, data } = await request(
      `PUT ${baseUrl}/user/starred/octocat/hello-world`,
    )
    expect(status).toBe(HttpStatusCode.NoContent)
    expect(data).toBeUndefined()
  })

  // Officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
  it('rejects requests to port 8', async () => {
    fetch.dontMockOnce()
    const requestPromise = request('GET https://127.0.0.1:8/')
    await expect(requestPromise).rejects.toHaveProperty(
      'status',
      HttpStatusCode.InternalServerError,
    )
  })

  it('rejects on 304 NotModified by default', async () => {
    fetch.once(() => Promise.resolve({ status: HttpStatusCode.NotModified }))
    const headers = { 'if-none-match': 'etag' }
    const requestPromise = request(`GET ${baseUrl}/orgs/myorg`, {}, { headers })
    await expect(requestPromise).rejects.toHaveProperty(
      'status',
      HttpStatusCode.NotModified,
    )
  })

  it('rejects on 404 NotFound', async () => {
    fetch.once(() => Promise.resolve({ status: HttpStatusCode.NotFound }))
    const requestPromise = request(`GET ${baseUrl}/org/myorg`)
    await expect(requestPromise).rejects.toHaveProperty(
      'status',
      HttpStatusCode.NotFound,
    )
  })

  it('provides response data in error object', async () => {
    const data = {
      documentation_url:
        'https://developer.github.com/v3/issues/labels/#create-a-label',
      errors: [
        {
          resource: 'Label',
          code: 'invalid',
          field: 'color',
        },
      ],
    }
    const response = {
      status: HttpStatusCode.UnprocessableEntity,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-foo': 'bar',
      },
    }
    fetch.once(() =>
      Promise.resolve({
        ...response,
        body: JSON.stringify(data),
      }),
    )

    const requestPromise = request(
      `POST ${baseUrl}/repos/octocat/hello-world/labels`,
    )
    await expect(requestPromise).rejects.toMatchObject<
      PartialDeep<RequestError>
    >({
      status: response.status,
      response: {
        ...response,
        data,
      },
    })
  })
})

describe('clientele request.create()', () => {
  it('is a function', () => {
    expect(request.create).toBeInstanceOf(Function)
  })

  it('returns a function', () => {
    const myRequest = request.create()
    expect(myRequest).toBeInstanceOf(Function)
  })

  it('passes defaults to fetch', async () => {
    const config = {
      baseUrl,
      headers: {
        'user-agent': 'custom user agent',
        authorization: 'token 12345',
      },
    }
    const myRequest = request.create(config)

    await myRequest('GET /users')
    expect(fetch).toHaveBeenLastCalledWith(`${config.baseUrl}/users`, {
      method: 'GET',
      headers: expect.objectContaining(config.headers) as typeof config.headers,
    })
  })

  it('allows overriding defaults', async () => {
    const defaultConfig = {
      baseUrl,
      headers: {
        'user-agent': 'custom user agent',
        authorization: 'token 12345',
      },
    }
    const myRequest = request.create(defaultConfig)

    const overrides = {
      baseUrl: 'https://github.com/api/v2',
      headers: {
        'user-agent': 'different user agent',
      },
    }

    await myRequest('GET /users', {}, overrides)
    expect(fetch).toHaveBeenLastCalledWith(`${overrides.baseUrl}/users`, {
      method: 'GET',
      headers: expect.objectContaining({
        ...defaultConfig.headers,
        ...overrides.headers,
      }) as typeof overrides.headers,
    })
  })

  it('cascades defaults', async () => {
    const defaultConfig = {
      baseUrl,
      headers: {
        'user-agent': 'custom user agent',
        authorization: 'token 12345',
      },
    }
    const myRequest = request.create(defaultConfig)

    const overrides = {
      baseUrl: 'https://github.com/api/v',
      headers: {
        'user-agent': 'different user agent',
      },
    }
    const myRequest2 = myRequest.create(overrides)

    await myRequest2('GET /users')
    expect(fetch).toHaveBeenLastCalledWith(`${overrides.baseUrl}/users`, {
      method: 'GET',
      headers: expect.objectContaining({
        ...defaultConfig.headers,
        ...overrides.headers,
      }) as typeof overrides.headers,
    })
  })
})

describe('clientele request instance', () => {
  it('is a function', () => {
    const myRequest = request.create({ baseUrl })
    expect(myRequest).toBeInstanceOf(Function)
  })

  it('uses configured baseUrl when route is omitted', async () => {
    const myRequest = request.create({
      baseUrl: `${baseUrl}/repos/{owner}/{repo}/issues`,
    })

    await myRequest({ owner: 'octocat', repo: 'hello-world' })
    expect(fetch).toHaveBeenLastCalledWith(
      `${baseUrl}/repos/octocat/hello-world/issues`,
      expect.anything(),
    )
  })

  it('appends url to configured baseUrl', async () => {
    const myRequest = request.create({ baseUrl })

    await myRequest('/api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3`)

    await myRequest('api/v3')
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3`)

    await myRequest('/api/v3/repos/{repo}', { repo: 'octocat' })
    expect(fetch.mock.lastCall?.[0]).toBe(`${baseUrl}/api/v3/repos/octocat`)
  })

  it('uses config', async () => {
    const myRequest = request.create({ baseUrl })
    const expectedUrl = 'https://github.com/api/v2'
    await myRequest({}, { baseUrl: expectedUrl })
    expect(fetch).toHaveBeenLastCalledWith(expectedUrl, expect.anything())
  })
})
