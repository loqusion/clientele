import { getUserAgent } from 'universal-user-agent'
import type { Constructor, UnionToIntersection } from 'type-fest'
import type {
  ClienteleDefaults,
  ClienteleRequestInterfaceOrInstance,
} from '@clientelejs/request'
import request from '@clientelejs/request'
import { mergeDeep } from '@clientelejs/shared'
import packageJson from '@clientelejs/core/package.json'

export type PluginMixin<N extends string, P> = {
  [k in N]: P
}
export type ClientelePlugin<N extends string, P> = () => PluginMixin<N, P>

type AnyPlugin = ClientelePlugin<any, any>
type PluginMixinsOf<T extends AnyPlugin[]> = UnionToIntersection<
  ReturnType<T[number]>
>

const DEFAULTS: ClienteleDefaults = {
  headers: {
    'user-agent': `clientele-core.js/${packageJson.version} ${getUserAgent()}`,
  },
}

export default class ClienteleCore<D extends ClienteleDefaults> {
  protected static plugins: AnyPlugin[] = []
  request: ClienteleRequestInterfaceOrInstance<D>

  static withPlugins<Plugins extends AnyPlugin[]>(
    ...plugins: Plugins
  ): typeof this & Constructor<PluginMixinsOf<Plugins>> {
    const currentPlugins = this.plugins
    const NewClienteleCore = class extends this<any> {
      static plugins = currentPlugins.concat(
        plugins.filter((p) => !currentPlugins.includes(p)),
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return NewClienteleCore as any
  }

  private applyPlugins() {
    const classConstructor = this.constructor as typeof ClienteleCore
    classConstructor.plugins.forEach((plugin) => {
      Object.assign(this, plugin())
    })
  }

  constructor(config: D = {} as D) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.request = request.create(mergeDeep(DEFAULTS, config)) as any
    this.applyPlugins()
  }
}
