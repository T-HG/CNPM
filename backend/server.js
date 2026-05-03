import app from './app.js'
import { env } from './config/env.js'
import { initDatabase } from './database/init.js'

async function bootstrap() {
  await initDatabase()
  const server = app.listen(env.port, () => {
    console.log(`API server running at http://localhost:${env.port}`)
  })
  server.on('error', (err) => {
    console.error('API listen error:', err)
    process.exit(1)
  })
  // concurrently / Windows: stdin là pipe và có thể gửi EOF khi spawn process thứ hai,
  // khiến Node kết thúc sớm nếu không giữ stdin hoặc ref server rõ ràng.
  if (!process.stdin.isTTY) {
    try {
      process.stdin.resume()
    } catch {
      /* ignore */
    }
  }
}

bootstrap().catch((error) => {
  console.error('Cannot start API server:', error)
  process.exit(1)
})
