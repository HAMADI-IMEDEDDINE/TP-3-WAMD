import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', validateObjectId, getProductById);

// Protected routes (JWT or OAuth2 Bearer token required)
router.post('/', protect, createProduct);
router.put('/:id', protect, validateObjectId, updateProduct);
router.delete('/:id', protect, validateObjectId, deleteProduct);

export default router;
