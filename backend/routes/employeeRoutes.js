import { Router } from 'express'
import {
  getEmployees,
  patchEmployeeRole,
  patchEmployeeStatus,
} from '../controllers/EmployeeController.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.get('/', asyncHandler(getEmployees))
router.patch('/:id/role', asyncHandler(patchEmployeeRole))
router.patch('/:id/status', asyncHandler(patchEmployeeStatus))

export default router
