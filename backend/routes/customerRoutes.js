import { Router } from 'express'
import { getCustomers } from '../controllers/CustomerController.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.get('/', asyncHandler(getCustomers))

export default router
