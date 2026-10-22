import { Router } from 'express';
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
} from '../controllers/inquiry.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createInquirySchema,
  updateInquiryStatusSchema,
  listInquiriesQuerySchema,
} from '../schemas/inquiry.schema';

const router = Router();

// All inquiry endpoints require authentication
router.use(requireAuth);

router.post('/', validateBody(createInquirySchema), createInquiry);
router.get('/', validateQuery(listInquiriesQuerySchema), getInquiries);
router.get('/:id', getInquiryById);
router.patch('/:id/status', validateBody(updateInquiryStatusSchema), updateInquiryStatus);

export default router;
