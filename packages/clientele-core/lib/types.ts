import type { ClienteleRequestConfig } from 'clientele-request/dist/types.js'

export type PluginMixin<N extends string, P> = {
  [k in N]: P
}

export type ClientelePlugin<N extends string, P> = () => PluginMixin<N, P>

export type ClienteleCoreConfig = ClienteleRequestConfig
