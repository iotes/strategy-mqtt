import mqtt, { MqttClient } from 'mqtt'
import {
  createDeviceDispatchable,
  DeviceFactory,
  HostConfig,
  Strategy,
  ClientConfig,
  createHostDispatchable,
} from 'iotes'
import { createDeviceFactory } from './deviceFactory'
import { DeviceTypes, StrategyConfig } from './types'

export const mqttStrategy: Strategy<StrategyConfig, DeviceTypes> = ({
  hostDispatch,
  deviceDispatch,
  hostSubscribe,
  deviceSubscribe,
}) => async (
  hostConfig: HostConfig<StrategyConfig>,
  clientConfig: ClientConfig,
): Promise<DeviceFactory<DeviceTypes>> => {
  const { existingConnection, ...config } = hostConfig.strategyConfig || {}
  const { name } = hostConfig

  const hostPath = `${hostConfig.host}:${hostConfig.port}`

  const connect = async (): Promise<MqttClient> => (
    new Promise((res, reject) => {
      if (!existingConnection) {
        try {
          res(mqtt.connect(hostPath, {
            clientId: clientConfig.name,
            ...config,
          }))
        } catch (error) {
          reject(Error(error))
        }
      }

      res(existingConnection)
    })
  )

  const host = await connect()

  host.on('connect', (connack: mqtt.IConnackPacket) => {
    hostDispatch(createHostDispatchable(name, 'CONNECT',
      { isConnected: host.connected },
      hostConfig,
      'MQTT_HOST'))
  })

  host.on('reconnect', () => {
    hostDispatch(createHostDispatchable(name, 'RECONNECTING', { isConnected: host.connected }, hostConfig, 'MQTT_HOST'))
  })

  host.on('reconnecting', () => {
    hostDispatch(createHostDispatchable(name, 'RECONNECTING', { isConnected: host.connected }, hostConfig, 'MQTT_HOST'))
  })

  host.on('disconnect', () => {
    hostDispatch((createHostDispatchable(name, 'DISCONNECT', { isConnected: host.connected }, hostConfig, 'MQTT_HOST')))
  })

  host.on('error', (error) => {
    hostDispatch((createHostDispatchable(
      name, 'DISCONNECT',
      { isConnected: host.connected },
      {},
      'MQTT_HOST',
      { message: error.message, level: 'ERROR' },
    )))
  })

  host.on('message', (topic: string, message: string) => {
    let mess: {[key: string]: any} = null
    let stringMess: {[key: string]: any} = null
    try {
      mess = JSON.parse(message.toString())
    } catch {
      stringMess = { message: message.toString() }
    }

    if (mess?.['@@iotes_storeId']) return

    const dispatchable = createDeviceDispatchable(topic, 'MQTT', mess || stringMess, hostConfig, 'MQTT_DEVICE')
    deviceDispatch(dispatchable)
  })

  return createDeviceFactory(
    { config: hostConfig, connection: host },
    clientConfig,
    {
      hostDispatch,
      deviceDispatch,
      hostSubscribe,
      deviceSubscribe,
    },
  )
}

// Export types

export { DeviceTypes, StrategyConfig }
