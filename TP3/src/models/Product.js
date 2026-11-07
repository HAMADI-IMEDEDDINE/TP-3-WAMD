import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      maxlength: [120, 'Product name must be at most 120 characters long.'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required.'],
      trim: true,
      maxlength: [2000, 'Product description must be at most 2000 characters long.'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required.'],
      min: [0, 'Product price must be greater than or equal to 0.'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required.'],
      trim: true,
      maxlength: [60, 'Product category must be at most 60 characters long.'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image URL is required.'],
      trim: true,
      maxlength: [2048, 'Product image URL must be at most 2048 characters long.'],
      match: [/^https?:\/\/\S+$/i, 'Product image URL must be a valid http(s) URL.'],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required.'],
      min: [0, 'Product stock must be greater than or equal to 0.'],
      validate: {
        validator: Number.isInteger,
        message: 'Product stock must be an integer.',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_document, returnedObject) {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        return returnedObject;
      },
    },
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
