import mongoose from 'mongoose';

const legSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    durationMins: { type: Number, required: true },
    costPerPerson: { type: Number, required: true },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    label: { type: String, required: true },
    reason: { type: String, required: true },
    totalTimeMins: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    costPerPerson: { type: Number, required: true },
    convenienceScore: { type: Number, required: true },
    legs: { type: [legSchema], default: [] }
  },
  { _id: false }
);

const journeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: String, required: true },
    purpose: { type: String, required: true, trim: true },
    travelerCount: { type: Number, required: true, min: 1 },
    preference: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
    chatFlow: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    options: { type: [optionSchema], default: [] },
    recommendedOptionId: { type: String, default: null },
    selectedOptionId: { type: String, default: null },
    bookingRef: { type: String, default: null },
    status: {
      type: String,
      enum: ['PLANNED', 'BOOKED'],
      default: 'PLANNED'
    }
  },
  { timestamps: true }
);

const Journey = mongoose.model('Journey', journeySchema);

export default Journey;
