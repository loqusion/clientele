import { isPlainObject } from 'is-plain-object'
import RequestError from './request-error.js'
import {
  ClienteleRequestHeaders,
  ClienteleRequestMeta,
  ClienteleResponse,
  HttpStatusCode,
  Method,
} from './types.js'
import { removeUndefinedProperties } from './utils.js'

async function getResponseData<T>(res: Response): Promise<T | undefined> {
  if (
    res.status === HttpStatusCode.NoContent ||
    res.status === HttpStatusCode.ResetContent
  ) {
    return undefined
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (/application\/json/.test(contentType)) {
    return (await res.json()) as T
  } else if (/text\/|charset=utf-8$/.test(contentType)) {
    return (await res.text()) as T
  } else {
    return (await res.arrayBuffer()) as T
  }
}

function rawHeaders<H extends Record<string, string> = Record<string, string>>(
  headers: Headers,
): H {
  const rawHeaders = {} as Record<string, string>
  headers.forEach((value, name) => {
    rawHeaders[name] = value
  })
  return rawHeaders as H
}

function toErrorMessage(data: unknown): string {
  /* istanbul ignore if */
  if (typeof data === 'string') return data
  return `Error: ${JSON.stringify(data)}`
}

export type FetchConfig = {
  url: string
  method: Method
  headers: ClienteleRequestHeaders
  body?: string
  redirect?: 'error' | 'follow' | 'manual'
  request?: ClienteleRequestMeta
}

export default async function fetchWrapper<T>(
  config: FetchConfig,
): Promise<ClienteleResponse<T>> {
  if (isPlainObject(config.body || Array.isArray(config.body))) {
    config.body = JSON.stringify(config.body)
  }

  const requestInit = removeUndefinedProperties({
    method: config.method,
    body: config.body,
    headers: config.headers as HeadersInit,
    redirect: config.redirect,
    ...config.request,
  })
  const fetchFn = (config.request?.fetch || fetch) as typeof fetch

  return fetchFn(config.url, requestInit)
    .then(async (rawResponse) => {
      const response: ClienteleResponse<T> = {
        url: rawResponse.url,
        status: rawResponse.status,
        headers: rawHeaders(rawResponse.headers),
        data: await getResponseData<T>(rawResponse),
      }

      if (response.status === HttpStatusCode.NotModified) {
        throw new RequestError('Not modified', response.status, {
          config,
          response,
        })
      } else if (response.status >= 400) {
        throw new RequestError(toErrorMessage(response.data), response.status, {
          config,
          response,
        })
      }

      return response
    })
    .catch((error: Error) => {
      if (error instanceof RequestError) throw error
      throw new RequestError(
        error.message,
        HttpStatusCode.InternalServerError,
        { config },
      )
    })
}
