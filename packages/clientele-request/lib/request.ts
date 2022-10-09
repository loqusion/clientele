import fetch from 'cross-fetch'
import { getUserAgent } from 'universal-user-agent'
import packageJson from '@clientelejs/request/package.json'
import type {
  ClienteleRequestConfig,
  ClienteleRequestHeaders,
  ClienteleRequestInterface,
  ClienteleRequestParameters,
  ClienteleResponse,
  Method,
  Route,
} from './types.js'
import { mergeDeep, removeUndefinedProperties } from './utils.js'

function mergeRouteAndParams(
  route: Route,
  params: ClienteleRequestParameters,
): Route {
  console.log(params)
  // TODO: implementation
  return route
}

type FetchConfig = {
  url: string
  method: string
  body: string
  headers: ClienteleRequestHeaders
  redirect?: 'error' | 'follow' | 'manual'
  request: Record<string, unknown>
}

function mergeRouteAndConfig(
  route: Route,
  config: Omit<ClienteleRequestConfig, 'url'>,
): FetchConfig {
  const [field1, field2] = route.split(' ')
  if (field2) {
    return {
      ...config,
      method: field1 as Method,
      url: field2,
    } as unknown as FetchConfig
  }
  return {
    ...config,
    url: field1,
  } as unknown as FetchConfig
}

async function fetchWrapper<
  T,
  R extends ClienteleResponse<T> = ClienteleResponse<T>,
>(config: FetchConfig): Promise<R> {
  const requestInit = removeUndefinedProperties({
    method: config.method,
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

const createInstance = (defaults: ClienteleRequestConfig = {}) => {
  const requestApi = async function request(...args: unknown[]) {
    let route: string
    let params: ClienteleRequestParameters
    let config: ClienteleRequestConfig
    if (typeof args[0] === 'string') {
      route = args[0]
      params = (args[1] ?? {}) as typeof params
      config = args[2] ?? {}
    } else {
      route = defaults.url || ''
      params = (args[0] ?? {}) as typeof params
      config = args[1] ?? {}
    }

    const mergedRoute = mergeRouteAndParams(route, params)
    const mergedConfig = mergeRouteAndConfig(mergedRoute, config)

    return fetchWrapper(mergedConfig)
  }

  requestApi.create = (config: ClienteleRequestConfig = {}) =>
    createInstance(mergeDeep(defaults, config))

  requestApi.defaults = defaults

  return requestApi
}

const request = createInstance({
  headers: {
    'user-agent': `clientele-request.js/${
      packageJson.version
    } ${getUserAgent()}`,
  },
}) as ClienteleRequestInterface

export default request
