import { Router } from 'express'
import {
  getInvoices,
  getRevenueSummary,
  patchInvoiceStatus,
  postInvoice,
} from '../controllers/InvoiceController.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()

router.get('/', asyncHandler(getInvoices))
router.post('/', asyncHandler(postInvoice))
router.patch('/:id/status', asyncHandler(patchInvoiceStatus))
router.get('/reports/revenue', asyncHandler(getRevenueSummary))

export default router
