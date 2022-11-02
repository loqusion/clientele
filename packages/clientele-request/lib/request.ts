import assert from 'node:assert'
import { getUserAgent } from 'universal-user-agent'
import packageJson from '@clientelejs/request/package.json'
import type {
  ClienteleDefaults,
  ClienteleRequestConfig,
  ClienteleRequestInterface,
  ClienteleRequestParameters,
  Method,
  Route,
} from './types.js'
import type { FetchConfig } from './fetch-wrapper.js'
import fetchWrapper from './fetch-wrapper.js'
import { parseTemplate } from './url-template.js'
import {
  addQueryParameters,
  extractUrlTemplateExpressions,
  lowercaseKeys,
  mergeDeep,
  methodCanHaveBody,
  removeUndefinedProperties,
} from './utils.js'

function normalizeConfig<C extends ClienteleRequestConfig | ClienteleDefaults>(
  config: C,
): C {
  const normalizedConfig = { ...config }
  if (normalizedConfig.headers) {
    normalizedConfig.headers = lowercaseKeys(
      removeUndefinedProperties(normalizedConfig.headers),
    ) as typeof config.headers
  }
  if ('method' in normalizedConfig) {
    normalizedConfig.method =
      normalizedConfig.method?.toUpperCase() as typeof normalizedConfig.method
  }
  return normalizedConfig
}

function mergeRouteAndConfig(
  route: Route,
  config: ClienteleRequestConfig,
): ClienteleRequestConfig {
  const [field1, field2] = route.split(' ')
  if (field2) {
    return {
      ...config,
      method: field1.toUpperCase() as Method,
      url: field2,
    }
  }
  return {
    ...config,
    url: field1,
  }
}

function getAbsoluteUrl(baseUrl: string, url: string) {
  url = url.replace(/:([a-z]\w+)/g, '{$1}')
  if (!/^https?:\/\//.test(url)) {
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    if (url.startsWith('/')) {
      url = url.slice(1)
    }
    url = [baseUrl, url].filter(Boolean).join('/')
  }
  return url
}

function mergeConfigAndParams(
  config: ClienteleRequestConfig,
  params: ClienteleRequestParameters,
): FetchConfig {
  const method = config.method || 'GET'
  const headers = { ...config.headers }
  let body: string | object | undefined

  const urlTemplate = getAbsoluteUrl(config.baseUrl || '', config.url || '')
  if (urlTemplate === '') {
    throw new Error('URL cannot be blank.')
  }
  let url = parseTemplate(urlTemplate).expand(params)

  const urlTemplateExpressions = extractUrlTemplateExpressions(urlTemplate)
  const remainingParameters = Object.fromEntries(
    Object.entries(params).filter(
      ([paramName]) => !urlTemplateExpressions.includes(paramName),
    ),
  )

  if (!methodCanHaveBody(method)) {
    url = addQueryParameters(url, remainingParameters)
  } else if (config.data) {
    body = config.data as typeof body
  } else if (Object.keys(remainingParameters).length) {
    body = remainingParameters
  }

  return {
    url,
    method,
    headers,
    ...(typeof body !== 'undefined' ? { body } : {}),
    ...(config.request ? { request: config.request } : {}),
  } as FetchConfig
}

const createInstance = (defaults: ClienteleDefaults = {}) => {
  const requestApi = async function request(...args: unknown[]) {
    let route: string
    let params: ClienteleRequestParameters
    let unnormalizedConfig: ClienteleRequestConfig
    if (typeof args[0] === 'string') {
      route = args[0]
      params = (args[1] ?? {}) as typeof params
      unnormalizedConfig = args[2] ?? {}
    } else {
      params = (args[0] ?? {}) as typeof params
      unnormalizedConfig = args[1] ?? {}
      route = unnormalizedConfig.url || ''
    }

    const config = normalizeConfig(unnormalizedConfig)
    const defaultsAndConfig = mergeDeep(requestApi.defaults, config)
    const mergedConfig = mergeRouteAndConfig(route, defaultsAndConfig)
    const fetchConfig = mergeConfigAndParams(mergedConfig, params)

    return fetchWrapper(fetchConfig)
  }

  requestApi.create = (newDefaults: ClienteleDefaults = {}) =>
    createInstance(mergeDeep(requestApi.defaults, newDefaults))

  requestApi.defaults = normalizeConfig(defaults)

  return requestApi
}

const request = createInstance({
  headers: {
    'user-agent': `clientele-request.js/${
      packageJson.version
    } ${getUserAgent()}`,
    'content-type': 'application/json; charset=utf-8',
  },
}) as ClienteleRequestInterface

export default request
