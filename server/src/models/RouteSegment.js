import mongoose from 'mongoose';

const routeSegmentSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mode: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    durationMins: { type: Number, required: true },
    elapsedMins: { type: Number, default: 0 },
    costPerPerson: { type: Number, required: true },
    notes: { type: String, default: '' },
    sequenceIndex: { type: Number, required: true },
    bookingRef: { type: String, required: true },
    status: {
      type: String,
      enum: ['ON_HOLD', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

const RouteSegment = mongoose.model('RouteSegment', routeSegmentSchema);

export default RouteSegment;
