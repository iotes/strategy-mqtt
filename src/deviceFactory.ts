import { MqttClient } from 'mqtt'
import {
  DeviceFactory,
  DeviceConfig,
  HostConfig,
  Iotes,
  ClientConfig,
  createHostDispatchable,
} from '@iotes/core'
import { DeviceTypes, StrategyConfig } from './types'

export const createDeviceFactory = (
  host: { config: HostConfig<StrategyConfig>; connection: MqttClient },
  client: ClientConfig,
  iotes: Iotes,
): DeviceFactory<DeviceTypes> => {
  const { deviceSubscribe, hostDispatch } = iotes

  // MQTT HOST
  const createExternalMqttChannel = async (
    device: DeviceConfig<'EXTERNAL_CHANNEL'>,
  ) => {
    const { name } = device

    deviceSubscribe(
      (state: any) => {
        if (state[name] && state[name]?.['@@iotes_storeId']) {
          host.connection.publish(name, JSON.stringify(state[name]))
        }
      },
      [name],
    )

    // Register listeners
    host.connection.subscribe(`${name}`, (error) => {
      hostDispatch(
        createHostDispatchable(
          host.config.name,
          'DEVICE_CONNECT',
          {
            deviceName: name,
            subscriptionPath: `${name}`,
          },
          { ...host.config },
          'MQTT_EXTERNAL_CHANNEL',
          error ? { message: error.message, level: 'ERROR' } : null,
        ),
      )
    })

    return device
  }

  // APP CHANNEL
  const createMqttChannel = async (device: DeviceConfig<'APP_CHANNEL'>) => {
    const { name } = device

    const publishPath = `${client.name}/${name}`

    deviceSubscribe(
      (state: any) => {
        if (state[name] && state[name]?.['@@iotes_storeId']) {
          host.connection.publish(publishPath, JSON.stringify(state[name]))
        }
      },
      [name],
    )

    // Register listeners
    host.connection.subscribe(publishPath, (error) => {
      hostDispatch(
        createHostDispatchable(
          host.config.name,
          'DEVICE_CONNECT',
          {
            deviceName: name,
            subscriptionPath: `${client.name}/${name}`,
          },
          { ...host.config },
          'MQTT_APP_CHANNEL',
          error ? { message: error.message, level: 'ERROR' } : null,
        ),
      )
    })

    return device
  }

  return {
    APP_CHANNEL: createMqttChannel,
    EXTERNAL_CHANNEL: createExternalMqttChannel,
  }
}
