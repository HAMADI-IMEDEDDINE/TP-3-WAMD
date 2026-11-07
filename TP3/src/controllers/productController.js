import Product from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(value, field, maxLength, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${field} must be a non-empty string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    errors.push(`${field} must be at most ${maxLength} characters long.`);
    return undefined;
  }

  return trimmed;
}

function readNonNegativeNumber(value, field, errors, { integer = false } = {}) {
  if (value === undefined || value === null || value === '') {
    errors.push(`${field} is required.`);
    return undefined;
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    errors.push(`${field} must be a number.`);
    return undefined;
  }

  const number = typeof value === 'number' ? value : Number(value.trim());

  if (!Number.isFinite(number)) {
    errors.push(`${field} must be a valid number.`);
    return undefined;
  }

  if (number < 0) {
    errors.push(`${field} must be greater than or equal to 0.`);
    return undefined;
  }

  if (integer && !Number.isInteger(number)) {
    errors.push(`${field} must be an integer.`);
    return undefined;
  }

  return number;
}

/**
 * Validates and normalizes product data.
 * On create, all fields are required. On update, only provided fields are
 * validated (partial update) but at least one field must be supplied.
 */
function buildProductData(body, { partial = false } = {}) {
  if (!isPlainObject(body)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  const errors = [];
  const data = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const shouldRead = (field) => !partial || has(field);

  if (shouldRead('name')) {
    const value = readString(body.name, 'name', 120, errors);
    if (value !== undefined) data.name = value;
  }

  if (shouldRead('description')) {
    const value = readString(body.description, 'description', 2000, errors);
    if (value !== undefined) data.description = value;
  }

  if (shouldRead('price')) {
    const value = readNonNegativeNumber(body.price, 'price', errors);
    if (value !== undefined) data.price = value;
  }

  if (shouldRead('category')) {
    const value = readString(body.category, 'category', 60, errors);
    if (value !== undefined) data.category = value;
  }

  if (shouldRead('imageUrl')) {
    const value = readString(body.imageUrl, 'imageUrl', 2048, errors);

    if (value !== undefined) {
      if (!/^https?:\/\/\S+$/i.test(value)) {
        errors.push('imageUrl must be a valid http(s) URL.');
      } else {
        data.imageUrl = value;
      }
    }
  }

  if (shouldRead('stock')) {
    const value = readNonNegativeNumber(body.stock, 'stock', errors, { integer: true });
    if (value !== undefined) data.stock = value;
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid product data.', errors);
  }

  if (partial && Object.keys(data).length === 0) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'At least one product field is required for an update.'
    );
  }

  return data;
}

/**
 * GET /api/products
 * Public endpoint returning every product.
 */
export async function getProducts(req, res) {
  const products = await Product.find({}).sort({ createdAt: 1 });

  res.status(200).json({
    count: products.length,
    products,
  });
}

/**
 * GET /api/products/:id
 * Public endpoint returning one product or 404.
 */
export async function getProductById(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }

  res.status(200).json({ product });
}

/**
 * POST /api/products
 * Protected endpoint creating a product.
 */
export async function createProduct(req, res) {
  const data = buildProductData(req.body);
  const product = await Product.create(data);

  res.status(201).json({
    message: 'Product created successfully.',
    product,
  });
}

/**
 * PUT /api/products/:id
 * Protected endpoint updating a product. Supports partial payloads.
 */
export async function updateProduct(req, res) {
  const data = buildProductData(req.body, { partial: true });
  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }

  res.status(200).json({
    message: 'Product updated successfully.',
    product,
  });
}

/**
 * DELETE /api/products/:id
 * Protected endpoint deleting a product.
 */
export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }

  res.status(200).json({
    message: 'Product deleted successfully.',
    product,
  });
}
