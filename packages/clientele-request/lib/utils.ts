import { isPlainObject } from 'is-plain-object'
import { Method } from './types.js'

const hasOwn = (obj: unknown, v: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, v)

export function methodCanHaveBody(method: Method) {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
}

export function lowercaseKeys(
  object: Record<string, unknown>,
): Record<Lowercase<string>, unknown> {
  return Object.keys(object).reduce<typeof object>((newObj, key) => {
    newObj[key.toLowerCase()] = object[key]
    return newObj
  }, {})
}

export function mergeDeep(
  defaults: Record<string, unknown>,
  options: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...defaults }

  Object.keys(options).forEach((key) => {
    if (isPlainObject(options[key]) && hasOwn(defaults, key)) {
      result[key] = mergeDeep(
        defaults[key] as typeof defaults,
        options[key] as typeof options,
      )
    } else {
      Object.assign(result, { [key]: options[key] })
    }
  })

  return result
}

export function removeUndefinedProperties(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  })
  return obj
}

function trimNonAlphaNumericChars(expression: string) {
  return expression.replace(/^\W+|\W+$/g, '')
}

export function extractUrlTemplateExpressions(url: string): string[] {
  const matches = url.match(/\{[^}]+\}/g)
  return (
    matches?.map(trimNonAlphaNumericChars).flatMap((s) => s.split(',')) || []
  )
}

export function addQueryParameters(
  url: string,
  params: Record<string, string | number | boolean>,
) {
  const paramEntries = Object.entries(params)
  if (!paramEntries.length) {
    return url
  }

  const delimiter = /\?/.test(url) ? '&' : '?'
  const queries = paramEntries.map(
    ([name, value]) => `${name}=${encodeURIComponent(value)}`,
  )

  return `${url}${delimiter}${queries.join('&')}`
}
