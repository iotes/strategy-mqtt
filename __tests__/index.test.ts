import mqtt from 'mqtt'
import { createIotes, TopologyMap, createDeviceDispatchable } from '@iotes/core'
import { mqttStrategy, DeviceTypes } from '../src'
import { createTestMqttBroker, createTestClient } from './utils'


const topology: TopologyMap<{}, DeviceTypes> = {
  hosts: [{ name: 'testapp/0', host: 'ws://localhost', port: '8888' }],
  client: { name: 'testApp' },
  devices: [
    {
      hostName: 'testapp/0',
      type: 'APP_CHANNEL',
      name: 'READER/1',
      channel: 1,
    },
    {
      hostName: 'testapp/0',
      type: 'EXTERNAL_CHANNEL',
      name: 'ENCODER/1',
      channel: 2,
    },
  ],
}

let testClient: any
let testBroker: any
let iotes: any

afterAll(() => {
  console.log('thing')
})

describe('iotes-strategy-mqtt', () => {
  beforeAll(async () => {
    iotes = createIotes({
      topology,
      strategy: mqttStrategy,
    })
    testBroker = await createTestMqttBroker()
    testClient = await createTestClient()
  })

  afterAll(async () => {
    await testClient.stop()
    await testBroker.stop()
    iotes = null
  })

  test('Can create iotes with mqtt strategy', async () => {
    await new Promise((res, _) => {
      setTimeout(() => res(), 100)
    })

    expect(iotes).not.toBeNull()
    expect(iotes).toHaveProperty('deviceDispatch')
    expect(iotes).toHaveProperty('deviceSubscribe')
    expect(iotes).toHaveProperty('hostDispatch')
    expect(iotes).toHaveProperty('hostSubscribe')
  })

  test('subscribes device correctly', async () => {
    let result: any

    iotes.deviceSubscribe(
      (state: any) => {
        result = state
      },
      ['ENCODER/1'],
    )

    testClient.publish('ENCODER/1', 'test')

    await new Promise((res, _) => {
      setTimeout(() => res(), 20)
    })

    expect(result['ENCODER/1'].payload.message).toBe('test')
  })

  test('Does not loopback', async () => {
    let result: any = {}

    iotes.deviceDispatch(
      createDeviceDispatchable(
        'ENCODER/1',
        'ENCODER/1',
        { message: 'test' },
        'APP',
      ),
    )

    iotes.deviceSubscribe(
      (state: any) => {
        result = state
      },
      ['ENCODER/1'],
    )

    await new Promise((res, _) => {
      setTimeout(() => res(), 20)
    })

    expect(result['ENCODER/1']).toBeUndefined()
  })

  test('Dispatches correctly', async () => {
    let result: any = {}

    const client = mqtt.connect('ws://127.0.0.1:8888')

    client.subscribe('ENCODER/1', () => {
      iotes.deviceDispatch(
        createDeviceDispatchable(
          'ENCODER/1',
          'ENCODER/1',
          { message: 'test' },
          'APP',
        ),
      )
    })

    client.on('message', (topic, message) => {
      result = JSON.parse(message.toString())
    })

    await new Promise((res, _) => {
      setTimeout(() => res(), 20)
    })

    client.end()

    expect(result.payload.message).toBe('test')
  })
})
