import type { Constructor, UnionToIntersection } from 'type-fest'
import type { ClienteleCoreConfig, ClientelePlugin } from './types.js'

type AnyPlugin = ClientelePlugin<any, any>
type AnyFunction = (...args: any) => any

type PluginMixinsOf<T extends AnyFunction[]> = UnionToIntersection<
  ReturnType<T[number]>
>

export default class ClienteleCore {
  protected static plugins: AnyPlugin[] = []

  static withPlugins<Plugins extends AnyPlugin[]>(
    ...plugins: Plugins
  ): typeof this & Constructor<PluginMixinsOf<Plugins>> {
    const currentPlugins = this.plugins
    const NewClienteleCore = class extends this {
      static plugins = currentPlugins.concat(
        plugins.filter((p) => !currentPlugins.includes(p)),
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return NewClienteleCore as any
  }

  // constructor(config: ClienteleCoreConfig = {}) {}
}
