import app from './app.js'
import { env } from './config/env.js'
import { initDatabase } from './database/init.js'

async function bootstrap() {
  await initDatabase()
  app.listen(env.port, () => {
    console.log(`API server running at http://localhost:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Cannot start API server:', error)
  process.exit(1)
})
