import ClienteleCore from './core.js'

describe('clientele - core', () => {
  it('adds plugins', () => {
    const MyClienteleCore = ClienteleCore.withPlugins(() => ({
      hello: 'world',
    }))
    const api = new MyClienteleCore()
    expect(api.hello).toBe('world')
  })
})
