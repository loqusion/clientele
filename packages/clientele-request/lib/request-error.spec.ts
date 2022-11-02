import RequestError, {
  requestErrorName,
  RequestErrorOptions,
} from './request-error.js'

const defaultConfig: RequestErrorOptions['config'] = {
  method: 'GET',
  url: '',
  headers: {},
}
const newRequestError = (
  message = 'test',
  status = 123,
  options: RequestErrorOptions = { config: defaultConfig },
) => new RequestError(message, status, options)

describe('clientele request error', () => {
  it('is an instance of Error', () => {
    expect(newRequestError()).toBeInstanceOf(Error)
  })

  it('sets constructor to RequestError', () => {
    expect(newRequestError()).toBeInstanceOf(RequestError)
  })

  it('sets name', () => {
    expect(newRequestError()).toHaveProperty('name', requestErrorName)
  })

  it('sets message', () => {
    expect(newRequestError('good test')).toHaveProperty('message', 'good test')
  })

  it('set status', () => {
    expect(newRequestError('test', 404)).toHaveProperty('status', 404)
  })

  it('sets config', () => {
    const config: RequestErrorOptions['config'] = {
      method: 'POST',
      url: 'https://api.github.com/authorizations',
      data: { note: 'test' },
    }
    expect(newRequestError('test', 123, { config })).toHaveProperty(
      'config',
      config,
    )
  })

  it('redacts credentials from request authorization header', () => {
    const config: RequestErrorOptions['config'] = {
      method: 'GET',
      url: 'https://api.github.com?client_id=123',
      headers: {
        authorization: 'token secret123',
      },
    }
    expect(newRequestError('test', 123, { config })).toHaveProperty(
      ['config', 'headers', 'authorization'],
      expect.not.stringMatching('secret123'),
    )
  })

  it('sets response', () => {
    const response: RequestErrorOptions['response'] = {
      url: 'https://api.github.com/',
      status: 404,
      data: { error: 'Not Found' },
      headers: { 'x-github-request-id': '1' },
    }
    expect(
      newRequestError('test', 123, { config: defaultConfig, response }),
    ).toHaveProperty('response', response)
  })
})
