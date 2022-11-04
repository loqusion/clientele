import { Method } from './types.js'

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
