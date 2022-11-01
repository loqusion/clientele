import fetchMock from 'jest-fetch-mock'
import RequestError from './request-error.js'

const fetch = fetchMock.default

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('cross-fetch', () => require('jest-fetch-mock'))

beforeEach(() => {
  fetch.mockReset()
})

describe('clientele request error', () => {
  it('is an instance of Error', () => {
    const error = new RequestError('test', 200)
    expect(error).toBeInstanceOf(Error)
  })
})
