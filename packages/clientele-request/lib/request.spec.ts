import fetchMock from 'jest-fetch-mock'
import request from './request.js'

const fetch = fetchMock.default

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('cross-fetch', () => require('jest-fetch-mock'))

const baseUrl = 'https://clientelejs.com'

beforeEach(() => {
  fetch.mockReset()
})

describe('request()', () => {
  it('is a function', () => {
    expect(request).toBeInstanceOf(Function)
  })

  it.todo('accepts method in route string')

  it.todo('defaults to GET when method is omitted from route string')

  it('passes headers to fetch', async () => {
    await request(baseUrl, {}, { headers: { test: 'wowowo' } })
    expect(fetch.mock.lastCall?.[1]).toHaveProperty('headers', {
      test: 'wowowo',
    })
  })

  it.todo('omits undefined headers')

  it.todo('allows custom user-agent')

  it.todo('converts uppercase header names to lowercase')

  it.todo('accepts request timeout')

  it.todo('accepts request agent')

  it.todo('config.request.signal')
  it.todo('config.request.fetch')
  it.todo('config.request.hook')
  it.todo('config.request.timeout')
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
      `${baseUrl}/repos/loqusion/clientelejs/contents/path/to/file.txt`,
    )
    await request(`${baseUrl}/repos/:owner/:repo/contents/:path`, {
      owner: 'loqusion',
      repo: 'clientelejs',
      path: 'path/to/file.txt',
    })
    expect(fetch.mock.lastCall?.[0]).toBe(
      `${baseUrl}/repos/loqusion/clientelejs/contents/path/to/file.txt`,
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
    expect(fetch).toHaveBeenLastCalledWith(baseUrl, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  })

  it.todo('allows HEAD requests')

  it('parses JSON response', async () => {
    fetch.once(
      JSON.stringify({
        data: 12345,
        array: ['hello', 'world', 1985],
        nested: {
          data: 67890,
        },
      }),
    )
    const { data } = await request(baseUrl)
    expect(data).toEqual({
      data: 12345,
      array: ['hello', 'world', 1985],
      nested: {
        data: 67890,
      },
    })
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
