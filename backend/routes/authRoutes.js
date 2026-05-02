import { Router } from 'express'
import {
  changePassword,
  checkEmail,
  login,
  register,
  updateProfile,
} from '../controllers/AuthController.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.post('/register', asyncHandler(register))
router.post('/check-email', asyncHandler(checkEmail))
router.patch('/profile', requireAuth, asyncHandler(updateProfile))
router.post('/change-password', requireAuth, asyncHandler(changePassword))

export default router
