import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import alertRoutes from './routes/alertRoutes.js'
import authRoutes from './routes/authRoutes.js'
import customerRoutes from './routes/customerRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import invoiceRoutes from './routes/invoiceRoutes.js'
import medicineRoutes from './routes/medicineRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

app.use(cors({ origin: env.corsOrigin, credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Pharmacy API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/medicines', medicineRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/invoices', invoiceRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
