import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required.'],
      trim: true,
      maxlength: [80, 'User name must be at most 80 characters long.'],
    },
    email: {
      type: String,
      required: [true, 'User email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'User email must be a valid email address.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_document, returnedObject) {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.passwordHash;
        return returnedObject;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
