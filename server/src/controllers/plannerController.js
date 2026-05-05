import Journey from '../models/Journey.js';
import RouteSegment from '../models/RouteSegment.js';
import User from '../models/User.js';
import https from 'https';
import { sendEmail } from '../utils/emailUtil.js';

const ALLOWED_PURPOSES = ['business', 'leisure', 'emergency', 'family trip'];
const ALLOWED_PREFERENCES = ['fastest', 'cheapest', 'balanced'];

const DISTANCE_KM = {
  'nit jalandhar|nit delhi': 380,
  'nit delhi|nit jalandhar': 380,
  'delhi|jaipur': 280,
  'jaipur|delhi': 280,
  'delhi|mumbai': 1420,
  'mumbai|delhi': 1420,
  'chandigarh|delhi': 245,
  'delhi|chandigarh': 245
};

const TRANSIT_HUBS = {
  'jalandhar': {
    station: 'Jalandhar City Railway Station (JUC)',
    busStand: 'Shaheed-e-Azam Sardar Bhagat Singh ISBT, Jalandhar',
    airport: 'Sri Guru Ram Dass Jee International Airport (ATQ)' // Amritsar
  },
  'delhi': {
    station: 'New Delhi Railway Station (NDLS)',
    busStand: 'Kashmere Gate ISBT, Delhi',
    airport: 'Indira Gandhi International Airport (DEL)'
  },
  'mumbai': {
    station: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
    busStand: 'Mumbai Central Depot',
    airport: 'Chhatrapati Shivaji Maharaj International Airport (BOM)'
  },
  'jaipur': {
    station: 'Jaipur Junction (JP)',
    busStand: 'Sindhi Camp Bus Stand, Jaipur',
    airport: 'Jaipur International Airport (JAI)'
  },
  'chandigarh': {
    station: 'Chandigarh Junction (CDG)',
    busStand: 'ISBT Sector 43, Chandigarh',
    airport: 'Shaheed Bhagat Singh International Airport (IXC)'
  }
};

const getHubs = (placeName) => {
  const lower = placeName.toLowerCase();
  if (lower.includes('jalandhar')) return TRANSIT_HUBS['jalandhar'];
  if (lower.includes('delhi')) return TRANSIT_HUBS['delhi'];
  if (lower.includes('mumbai')) return TRANSIT_HUBS['mumbai'];
  if (lower.includes('jaipur')) return TRANSIT_HUBS['jaipur'];
  if (lower.includes('chandigarh')) return TRANSIT_HUBS['chandigarh'];

  const safeName = placeName.replace(/NIT\s+|IIT\s+|IIIT\s+/ig, '').trim();
  return {
    station: `${safeName} Central Railway Station`,
    busStand: `${safeName} ISBT`,
    airport: `${safeName} International Airport`
  };
};

const toKey = (source, destination) =>
  `${source.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;

const toTitle = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const geocode = (query) => {
  return new Promise((resolve) => {
    const cleanQuery = query.replace(/NIT\s+|IIT\s+|IIIT\s+|Central\s+|Railway\s+|Station\s+|Airport\s+/ig, '').trim();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}`;
    
    https.get(url, { headers: { 'User-Agent': 'TravelWithoutTensionApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result && result.length > 0) {
            resolve({ lat: parseFloat(result[0].lat), lon: parseFloat(result[0].lon) });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const estimateDistance = async (source, destination) => {
  const known = DISTANCE_KM[toKey(source, destination)];
  if (known) return known;

  const loc1 = await geocode(source);
  const loc2 = await geocode(destination);
  
  if (loc1 && loc2) {
    const dist = haversine(loc1.lat, loc1.lon, loc2.lat, loc2.lon) * 1.3; // 1.3 routing factor for roads
    return Math.max(10, Math.round(dist));
  }

  const tokenCount = new Set(
    `${source} ${destination}`
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  ).size;

  return Math.max(220, Math.min(1400, 140 * tokenCount));
};

const isSharedMode = (mode) => {
  const lower = mode.toLowerCase();
  return lower.includes('cab') || lower.includes('auto');
};

const adjustCostPerPerson = (baseCostPerPerson, mode, travelerCount) => {
  if (travelerCount <= 1) return baseCostPerPerson;

  const lower = mode.toLowerCase();

  if (isSharedMode(mode)) {
    return Math.max(60, Math.round(baseCostPerPerson * 0.62));
  }

  if (lower.includes('train') || lower.includes('bus')) {
    return travelerCount >= 4
      ? Math.round(baseCostPerPerson * 0.9)
      : baseCostPerPerson;
  }

  if (lower.includes('flight')) {
    return travelerCount >= 3
      ? Math.round(baseCostPerPerson * 0.95)
      : baseCostPerPerson;
  }

  return baseCostPerPerson;
};

const buildOption = ({ optionId, label, reason, convenienceScore, legs, travelerCount }) => {
  const normalizedLegs = legs.map((leg) => {
    const adjustedCostPerPerson = adjustCostPerPerson(leg.costPerPerson, leg.mode, travelerCount);

    return {
      ...leg,
      costPerPerson: adjustedCostPerPerson
    };
  });

  const totalTimeMins = normalizedLegs.reduce((sum, leg) => sum + leg.durationMins, 0);
  const costPerPerson = normalizedLegs.reduce((sum, leg) => sum + leg.costPerPerson, 0);
  const totalCost = costPerPerson * travelerCount;

  return {
    optionId,
    label,
    reason,
    totalTimeMins,
    totalCost,
    costPerPerson,
    convenienceScore,
    legs: normalizedLegs
  };
};

const buildMultimodalOptions = async ({ source, destination, travelerCount }) => {
  const sourceName = toTitle(source);
  const destinationName = toTitle(destination);
  const distance = await estimateDistance(sourceName, destinationName);

  const sourceHubs = getHubs(sourceName);
  const destHubs = getHubs(destinationName);

  // 1. Car / Cab (Direct)
  const carDuration = Math.round((distance / 65) * 60); // approx 65 km/h
  const carTotalCost = distance * 14; // 14 INR per km
  const carCostPerPerson = Math.round(carTotalCost / travelerCount);

  const carOption = buildOption({
    optionId: 'CAR-1',
    label: 'Direct Cab/Car',
    reason: 'Door-to-door convenience and privacy.',
    convenienceScore: 9.5,
    travelerCount,
    legs: [
      {
        mode: 'Cab',
        from: sourceName,
        to: destinationName,
        durationMins: carDuration,
        costPerPerson: carCostPerPerson,
        notes: 'Direct drive.'
      }
    ]
  });

  // 2. Bus
  const busDuration = Math.round((distance / 50) * 60); // approx 50 km/h
  const busCostPerPerson = distance > 300 ? 600 : 400;

  const busOption = buildOption({
    optionId: 'BUS-1',
    label: 'Intercity AC Bus',
    reason: 'Economical choice for travel.',
    convenienceScore: 7.0,
    travelerCount,
    legs: [
      {
        mode: 'Auto',
        from: sourceName,
        to: sourceHubs.busStand,
        durationMins: 20,
        costPerPerson: 100,
        notes: 'Transfer to bus stand.'
      },
      {
        mode: 'AC Bus',
        from: sourceHubs.busStand,
        to: destHubs.busStand,
        durationMins: busDuration,
        costPerPerson: busCostPerPerson,
        notes: 'Main bus journey.'
      },
      {
        mode: 'Auto',
        from: destHubs.busStand,
        to: destinationName,
        durationMins: 20,
        costPerPerson: 100,
        notes: 'Transfer from bus stand.'
      }
    ]
  });

  // 3. Train
  const trainDuration = Math.round((distance / 80) * 60); // approx 80 km/h
  const trainCostPerPerson = distance > 300 ? 1200 : 800;

  const trainOption = buildOption({
    optionId: 'TRAIN-1',
    label: 'Train (3AC)',
    reason: 'Comfortable and affordable long-distance travel.',
    convenienceScore: 8.5,
    travelerCount,
    legs: [
      {
        mode: 'Cab',
        from: sourceName,
        to: sourceHubs.station,
        durationMins: 30,
        costPerPerson: 250,
        notes: 'Transfer to railway station.'
      },
      {
        mode: 'Train (3AC)',
        from: sourceHubs.station,
        to: destHubs.station,
        durationMins: trainDuration,
        costPerPerson: trainCostPerPerson,
        notes: 'Main train journey.'
      },
      {
        mode: 'Cab',
        from: destHubs.station,
        to: destinationName,
        durationMins: 30,
        costPerPerson: 250,
        notes: 'Transfer from railway station.'
      }
    ]
  });

  const options = [
    cheapestPurposeHint(busOption, destinationName),
    carOption,
    trainOption
  ];

  // 4. Flight (only if distance > 250)
  if (distance > 250) {
    const flightDuration = 90; // approx 1.5 hrs
    const flightCostPerPerson = 4500;

    const flightOption = buildOption({
      optionId: 'FLIGHT-1',
      label: 'Flight',
      reason: 'Fastest way to travel long distances.',
      convenienceScore: 8.0,
      travelerCount,
      legs: [
        {
          mode: 'Cab',
          from: sourceName,
          to: sourceHubs.airport,
          durationMins: 45,
          costPerPerson: 400,
          notes: 'Transfer to airport.'
        },
        {
          mode: 'Flight',
          from: sourceHubs.airport,
          to: destHubs.airport,
          durationMins: flightDuration,
          costPerPerson: flightCostPerPerson,
          notes: 'Main flight.'
        },
        {
          mode: 'Cab',
          from: destHubs.airport,
          to: destinationName,
          durationMins: 45,
          costPerPerson: 400,
          notes: 'Transfer from airport.'
        }
      ]
    });
    options.push(flightOption);
  }

  return options;
};

const cheapestPurposeHint = (option, destinationName) => ({
  ...option,
  reason: `${option.reason} Good pick when exploring ${destinationName} on budget.`
});

const rankOptions = ({ options, preference, purpose, travelerCount, gender, travelTime }) => {
  const purposeValue = purpose.toLowerCase();

  const isNightTravel = travelTime && (parseInt(travelTime.split(':')[0]) >= 20 || parseInt(travelTime.split(':')[0]) <= 5);
  const requiresSafetyBoost = gender === 'female' && isNightTravel && travelerCount === 1;

  const scored = options.map((option) => {
    let score = option.convenienceScore * 20;

    if (preference === 'fastest') score += 6000 / Math.max(option.totalTimeMins, 1);
    if (preference === 'cheapest') score += 4500 / Math.max(option.costPerPerson, 1);
    if (preference === 'balanced') {
      score += 2800 / Math.max(option.totalTimeMins, 1);
      score += 2200 / Math.max(option.costPerPerson, 1);
    }

    if (purposeValue === 'business') score += 5000 / Math.max(option.totalTimeMins, 1);
    if (purposeValue === 'leisure') score += 3000 / Math.max(option.costPerPerson, 1);
    if (purposeValue === 'emergency') score += 7000 / Math.max(option.totalTimeMins, 1);

    if (travelerCount > 1 && option.label.toLowerCase().includes('comfort')) score += 12;

    if (requiresSafetyBoost) {
      if (option.label.includes('Train') || option.label.includes('Flight')) {
        score += 5000; // prioritize verified/shared options
      } else if (option.label.includes('Cab') || option.label.includes('Car')) {
        score -= 2000; // penalize long night cabs
      }
    }

    return { option, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((item) => item.option);
};

const buildRecommendations = ({ purpose, travelerCount, preference }) => {
  const points = [];

  if (travelerCount > 1) {
    points.push('Group detected: shared cab/auto legs are applied to reduce first/last-mile cost.');
  }

  if (purpose === 'business') {
    points.push('Business trip: fastest route receives higher ranking priority.');
  }

  if (purpose === 'leisure') {
    points.push('Leisure trip: affordable and relaxed options are ranked higher.');
  }

  if (preference === 'cheapest') {
    points.push('Cheapest preference selected: train/bus-heavy plans are prioritized.');
  }

  if (preference === 'fastest') {
    points.push('Fastest preference selected: flight/express routes are prioritized.');
  }

  return points;
};

const buildChatFlow = ({ source, destination, travelDate, purpose, travelerCount, preference }) => [
  `1. Source captured: ${source}`,
  `2. Destination captured: ${destination}`,
  `3. Travel date captured: ${travelDate}`,
  `4. Purpose captured: ${purpose}`,
  `5. Number of travelers captured: ${travelerCount}`,
  `6. Preference captured: ${preference}`,
  '7. Multimodal route generation started (auto/cab + train/flight/bus + last-mile cab/auto).',
  '8. Ranked routes produced by speed, cost, and convenience score.'
];

const validateInput = ({ source, destination, travelDate, purpose, travelerCount, preference }) => {
  if (!source || !destination || !travelDate || !purpose || !preference) {
    return 'source, destination, travelDate, purpose and preference are required.';
  }

  if (!Number.isInteger(travelerCount) || travelerCount < 1) {
    return 'travelerCount must be a positive integer.';
  }

  if (!ALLOWED_PREFERENCES.includes(preference)) {
    return 'preference must be fastest, cheapest or balanced.';
  }

  if (!ALLOWED_PURPOSES.includes(purpose)) {
    return 'purpose must be business, leisure, emergency or family trip.';
  }

  return null;
};

export const generateTripPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const payload = {
      source: req.body.source?.trim(),
      destination: req.body.destination?.trim(),
      travelDate: req.body.travelDate,
      travelTime: req.body.travelTime,
      purpose: req.body.purpose?.toLowerCase().trim(),
      travelerCount: Number(req.body.travelerCount),
      preference: req.body.preference?.toLowerCase().trim(),
      notes: req.body.notes?.trim() || ''
    };

    const validationError = validateInput(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const generatedOptions = await buildMultimodalOptions(payload);
    const rankedOptions = rankOptions({
      options: generatedOptions,
      preference: payload.preference,
      purpose: payload.purpose,
      travelerCount: payload.travelerCount,
      gender: user?.gender,
      travelTime: payload.travelTime
    });

    const recommendedOptionId = rankedOptions[0]?.optionId || null;
    const recommendations = buildRecommendations(payload);
    const chatFlow = buildChatFlow(payload);

    const journey = await Journey.create({
      user: req.user.userId,
      ...payload,
      options: rankedOptions,
      recommendedOptionId,
      recommendations,
      chatFlow,
      status: 'PLANNED'
    });

    return res.status(201).json({
      message: 'Journey options generated successfully.',
      journeyId: journey._id,
      source: journey.source,
      destination: journey.destination,
      travelDate: journey.travelDate,
      purpose: journey.purpose,
      travelerCount: journey.travelerCount,
      preference: journey.preference,
      notes: journey.notes,
      chatFlow: journey.chatFlow,
      recommendations: journey.recommendations,
      recommendedOptionId,
      options: journey.options
    });
  } catch (error) {
    console.error('Trip planner error:', error.message);
    return res.status(500).json({ message: 'Unable to generate journey options right now.' });
  }
};

export const bookJourney = async (req, res) => {
  try {
    const { journeyId, optionId } = req.body;

    if (!journeyId || !optionId) {
      return res.status(400).json({ message: 'journeyId and optionId are required.' });
    }

    const journey = await Journey.findOne({ _id: journeyId, user: req.user.userId });

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found.' });
    }

    const selectedOption = journey.options.find((option) => option.optionId === optionId);
    if (!selectedOption) {
      return res.status(400).json({ message: 'Invalid optionId for this journey.' });
    }

    journey.selectedOptionId = optionId;
    journey.status = 'BOOKED';
    journey.bookingRef = `TWT-${Date.now().toString().slice(-6)}`;

    await journey.save();

    const routeSegmentsData = selectedOption.legs.map((leg, index) => {
      let status = 'PENDING';
      if (index === 0) {
        status = 'IN_PROGRESS';
      } else if (index === selectedOption.legs.length - 1 && leg.mode.toLowerCase().includes('cab')) {
        status = 'ON_HOLD';
      }

      return {
        journeyId: journey._id,
        user: req.user.userId,
        mode: leg.mode,
        from: leg.from,
        to: leg.to,
        durationMins: leg.durationMins,
        costPerPerson: leg.costPerPerson,
        notes: leg.notes || '',
        sequenceIndex: index + 1,
        bookingRef: `${leg.mode.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${index + 1}`,
        status
      };
    });

    const segments = await RouteSegment.insertMany(routeSegmentsData);

    // Send booking confirmation email (non-blocking)
    const user = await User.findById(req.user.userId);
    if (user?.email) {
      const legSummary = selectedOption.legs
        .map((l, i) => `  ${i + 1}. ${l.mode}: ${l.from} → ${l.to} (${l.durationMins} mins, INR ${l.costPerPerson}/person)`)
        .join('\n');

      sendEmail({
        email: user.email,
        subject: `✅ Booking Confirmed: ${journey.bookingRef} | TWT`,
        message: `Hi ${user.name},\n\nYour journey has been successfully booked!\n\n` +
          `📋 Booking Reference: ${journey.bookingRef}\n` +
          `🗺️  Route: ${journey.source} → ${journey.destination}\n` +
          `📅 Date: ${journey.travelDate}\n` +
          `👤 Travelers: ${journey.travelerCount}\n` +
          `💰 Total Cost: INR ${selectedOption.totalCost}\n\n` +
          `🚦 Journey Breakdown:\n${legSummary}\n\n` +
          `You can track your journey live on the TWT platform.\n\n` +
          `Safe travels!\nTravel Without Tension Team`
      }).catch(err => console.error('Email send failed silently:', err));
    }

    return res.status(200).json({
      message: 'Journey booked successfully.',
      bookingRef: journey.bookingRef,
      status: journey.status,
      selectedOption,
      segments
    });
  } catch (error) {
    console.error('Book journey error:', error.message);
    return res.status(500).json({ message: 'Unable to complete booking right now.' });
  }
};

export const getAllJourneys = async (req, res) => {
  try {
    const journeys = await Journey.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .select('source destination travelDate status bookingRef selectedOptionId options createdAt travelerCount');

    return res.status(200).json({ journeys });
  } catch (error) {
    console.error('Get all journeys error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch journeys.' });
  }
};

export const getActiveJourney = async (req, res) => {
  try {
    const journey = await Journey.findOne({ user: req.user.userId, status: 'BOOKED' }).sort({ createdAt: -1 });
    if (!journey) {
      return res.status(404).json({ message: 'No active journey found.' });
    }

    const segments = await RouteSegment.find({ journeyId: journey._id }).sort({ sequenceIndex: 1 });
    const user = await User.findById(req.user.userId);

    return res.status(200).json({ 
      journey, 
      segments, 
      walletBalance: user?.walletBalance || 0 
    });
  } catch (error) {
    console.error('Get active journey error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch active journey.' });
  }
};

export const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    const journey = await Journey.findOne({ _id: id, user: req.user.userId });
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found.' });
    }

    const segments = await RouteSegment.find({ journeyId: journey._id }).sort({ sequenceIndex: 1 });
    const user = await User.findById(req.user.userId);

    return res.status(200).json({
      journey,
      segments,
      walletBalance: user?.walletBalance || 0
    });
  } catch (error) {
    console.error('Get journey by ID error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch journey.' });
  }
};

export const simulateSegment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const segment = await RouteSegment.findOne({ _id: id, user: req.user.userId });
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found.' });
    }

    let notification = null;

    if (action === 'progress') {
      segment.elapsedMins += 10;
      await segment.save();

      if (segment.elapsedMins >= segment.durationMins * 0.8) {
        const nextSegment = await RouteSegment.findOne({
          journeyId: segment.journeyId,
          sequenceIndex: segment.sequenceIndex + 1
        });

        if (nextSegment && nextSegment.status === 'ON_HOLD') {
          nextSegment.status = 'PENDING';
          await nextSegment.save();
          notification = `Your Train/Flight is nearing arrival. Final Cab (${nextSegment.bookingRef}) is now Confirmed!`;
        }
      }

      return res.status(200).json({ message: 'Progress updated.', segment, notification });
    } else if (action === 'complete') {
      segment.status = 'COMPLETED';
      segment.elapsedMins = segment.durationMins;
      await segment.save();

      const nextSegment = await RouteSegment.findOne({
        journeyId: segment.journeyId,
        sequenceIndex: segment.sequenceIndex + 1
      });

      if (nextSegment) {
        if (nextSegment.status === 'PENDING') {
          nextSegment.status = 'IN_PROGRESS';
          await nextSegment.save();
        }
        notification = `You have arrived at ${segment.to}. Your ${nextSegment.mode} (Leg ${nextSegment.sequenceIndex}) is now active.`;
      } else {
        const journey = await Journey.findById(segment.journeyId);
        if (journey) {
          journey.status = 'COMPLETED';
          await journey.save();
          
          const totalCost = journey.options.find(o => o.optionId === journey.selectedOptionId)?.totalCost || 0;
          notification = `Journey complete. Total cost of INR ${totalCost} deducted from your TWT Wallet.`;
        }
      }

      return res.status(200).json({ message: 'Segment completed.', segment, notification });
    } else if (action === 'delay') {
      segment.elapsedMins += 20; // add 20 mins of delay
      await segment.save();

      if (segment.elapsedMins > segment.durationMins + 15) {
        const credit = Math.round(segment.costPerPerson * 0.05);
        const user = await User.findById(req.user.userId);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + credit;
          await user.save();
          notification = `Delay detected. INR ${credit} (5% inconvenience credit) has been added to your TWT Wallet.`;
        }
      } else {
        notification = `Segment delayed by 20 mins. Total elapsed: ${segment.elapsedMins} mins.`;
      }
      return res.status(200).json({ message: 'Segment delayed.', segment, notification });

    } else if (action === 'cancel') {
      segment.status = 'CANCELLED';
      await segment.save();

      await RouteSegment.updateMany(
        { journeyId: segment.journeyId, sequenceIndex: { $gt: segment.sequenceIndex } },
        { status: 'CANCELLED' }
      );

      const remainingSegments = await RouteSegment.find({ 
        journeyId: segment.journeyId, 
        sequenceIndex: { $gte: segment.sequenceIndex } 
      });

      const totalRefund = remainingSegments.reduce((sum, seg) => sum + seg.costPerPerson, 0);

      const user = await User.findById(req.user.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + totalRefund;
        await user.save();
      }

      notification = `Segment Cancelled. INR ${totalRefund} has been refunded to your TWT Wallet.`;
      return res.status(200).json({ message: 'Segment cancelled.', segment, notification });
    }

    return res.status(400).json({ message: 'Invalid action.' });
  } catch (error) {
    console.error('Simulate segment error:', error.message);
    return res.status(500).json({ message: 'Unable to simulate segment.' });
  }
};
