import mqtt from 'mqtt'

export const createTestClient = () => (
  new Promise((resolve, reject) => {
    const client = mqtt.connect('ws://127.0.0.1:8888')

    const publish = (topic: string, message: string) => {
      client.publish(topic, message)
    }
    const stop = async () => {
      await client.end()
    }
    const subscribe = (topic, callback) => client.subscribe(topic, callback)
    const subscription: any = null

    client.on('connect', () => {
      resolve({
        publish,
        subscribe,
        subscription,
        stop,
      })
    })
  })
)
