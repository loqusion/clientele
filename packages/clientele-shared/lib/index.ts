import { isPlainObject } from 'is-plain-object'

const hasOwn = (obj: unknown, v: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, v)

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
