import { ClienteleRequestConfig, ClienteleResponse } from './types.js'

export type RequestErrorOptions = {
  response?: ClienteleResponse<unknown>
  config: ClienteleRequestConfig
}

export default class RequestError extends Error {
  name: 'ClienteleRequestError'
  status: number
  config: ClienteleRequestConfig
  response?: ClienteleResponse<unknown>

  constructor(
    message: string,
    statusCode: number,
    options: RequestErrorOptions,
  ) {
    super(message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    this.name = 'ClienteleRequestError'
    this.status = statusCode

    if ('response' in options) {
      this.response = options.response
    }

    // redact request credentials without mutating original request options
    const configCopy = { ...options.config }
    if (options.config.headers?.authorization) {
      configCopy.headers = {
        ...options.config.headers,
        authorization: options.config.headers.authorization.replace(
          /\s.*$/,
          ' [REDACTED]',
        ),
      }
    }
    this.config = configCopy
  }
}
