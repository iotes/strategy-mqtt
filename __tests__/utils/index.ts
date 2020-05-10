
import createAedes from 'aedes'
import { createServer as createNetServer } from 'net'
import { createServer as createHttpServer } from 'http'
import ws from 'websocket-stream'

export { createTestClient } from './client'

export const createTestMqttBroker = async () => {
  const aedes = createAedes()
  const netServer = createNetServer(aedes.handle)
  const httpServer = createHttpServer()

  const port = 1883
  const wsPort = 8888

  await new Promise((resolve) => {
    netServer.listen(port, () => {
      resolve()
    })
  })

  await new Promise((resolve) => {
    httpServer.listen(wsPort, () => {
      resolve()
    })
  })

  console.log(`Server listening on port ${port}, websocket server listening on ${wsPort}`)

  ws.createServer({
    server: httpServer,
  // @ts-ignore
  }, aedes.handle)

  const stop = async () => {
    httpServer.close()
    netServer.close()
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      httpServer.close()
    }
  })

  return {
    stop,
  }
}
