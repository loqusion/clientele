import type {
  ClienteleRequestHeaders,
  ClienteleRequestMeta,
  ClienteleResponse,
} from './types.js'
import { removeUndefinedProperties } from './utils.js'

export type FetchConfig = {
  url: string
  method: string
  body: string
  headers: ClienteleRequestHeaders
  redirect?: 'error' | 'follow' | 'manual'
  request: ClienteleRequestMeta
}

export default async function fetchWrapper<
  T,
  R extends ClienteleResponse<T> = ClienteleResponse<T>,
>(config: FetchConfig): Promise<R> {
  const requestInit = removeUndefinedProperties({
    method: config.method || 'GET',
    body: config.body,
    headers: config.headers as HeadersInit,
    redirect: config.redirect,
    ...config.request,
  })
  const res = await fetch(config.url, requestInit)

  try {
    return {
      res,
      data: JSON.parse(await res.text()) as T,
    } as unknown as R
  } catch (err) {
    return {
      res,
      err,
      data: null,
    } as unknown as R
  }
}
