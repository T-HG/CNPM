import { Router } from 'express'
import {
  getAlerts,
  patchAlertResolution,
  postAlert,
} from '../controllers/AlertController.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.get('/', asyncHandler(getAlerts))
router.post('/', asyncHandler(postAlert))
router.patch('/:id/resolve', asyncHandler(patchAlertResolution))

export default router
