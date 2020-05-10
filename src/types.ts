import { MqttClient, IClientOptions } from 'mqtt'

export type DeviceTypes = 'APP_CHANNEL' | 'EXTERNAL_CHANNEL'

export type StrategyConfig = {
    existingConnection?: MqttClient
} & IClientOptions
