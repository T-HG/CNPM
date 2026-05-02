import { Router } from 'express'
import {
  getCategories,
  getMedicine,
  getMedicines,
  patchMedicineStock,
  postCategory,
  postMedicine,
} from '../controllers/MedicineController.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.get('/categories', asyncHandler(getCategories))
router.post('/categories', asyncHandler(postCategory))
router.get('/', asyncHandler(getMedicines))
router.post('/', asyncHandler(postMedicine))
router.get('/:id', asyncHandler(getMedicine))
router.patch('/:id/stock', asyncHandler(patchMedicineStock))

export default router
