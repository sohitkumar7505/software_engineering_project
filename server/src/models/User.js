import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    },
    walletBalance: {
      type: Number,
      default: 5000
    },
    emergencyContacts: [{
      name: String,
      phone: {
        iv: String,
        encryptedData: String
      }
    }]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

export default User;
