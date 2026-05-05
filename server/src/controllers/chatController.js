const CITIES = [
  'delhi', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
  'jaipur', 'chandigarh', 'jalandhar', 'patna', 'lucknow', 'pune', 'ahmedabad',
  'surat', 'nagpur', 'indore', 'bhopal', 'amritsar', 'ludhiana', 'agra',
  'varanasi', 'kochi', 'coimbatore', 'visakhapatnam', 'bhubaneswar', 'guwahati',
  'dehradun', 'shimla', 'manali', 'jodhpur', 'udaipur', 'goa', 'mysuru',
  // NIT/IIT cities
  'nit jalandhar', 'nit delhi', 'nit patna', 'nit warangal', 'nit trichy',
  'iit delhi', 'iit mumbai', 'iit kanpur', 'iit kharagpur', 'iit madras',
  'iit bombay', 'iit roorkee', 'iit guwahati', 'iit hyderabad'
];

const PURPOSE_MAP = {
  business: ['business', 'meeting', 'conference', 'office', 'work', 'client'],
  leisure:  ['vacation', 'holiday', 'leisure', 'fun', 'trip', 'travel', 'explore', 'visit'],
  emergency: ['emergency', 'urgent', 'immediately', 'asap', 'critical', 'hospital', 'accident'],
  'family trip': ['family', 'parents', 'relatives', 'cousin', 'uncle', 'aunt', 'grandparents'],
};

const PREFERENCE_MAP = {
  fastest:  ['fast', 'quick', 'hurry', 'urgent', 'asap', 'speed', 'express', 'flight'],
  cheapest: ['cheap', 'budget', 'affordable', 'save money', 'economical', 'low cost', 'inexpensive'],
  balanced: ['balanced', 'comfortable', 'moderate'],
};

// Extract number words like "two", "three" etc.
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

const parseNaturalLanguage = (text) => {
  const lower = text.toLowerCase();
  const extracted = {};

  // --- Cities ---
  const foundCities = CITIES.filter(c => lower.includes(c)).sort((a, b) => b.length - a.length);

  if (foundCities.length >= 2) {
    // Try to detect "from X to Y" or "X to Y" order
    const fromMatch = lower.match(/(?:from|leaving|departing from|at|in)\s+([\w\s]+?)(?:\s+to\s+)/i);
    const toMatch   = lower.match(/(?:to|towards|reach|going to|arrive at|destination)\s+([\w\s]+?)(?:\s|$|,)/i);

    if (fromMatch) {
      const src = foundCities.find(c => fromMatch[1].includes(c));
      if (src) extracted.source = src.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (toMatch) {
      const dest = foundCities.find(c => toMatch[1].includes(c));
      if (dest) extracted.destination = dest.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Fallback: first city = source, second = destination
    if (!extracted.source && !extracted.destination) {
      extracted.source      = foundCities[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      extracted.destination = foundCities[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (extracted.source && !extracted.destination) {
      const remaining = foundCities.find(c => !c.includes(extracted.source.toLowerCase()));
      if (remaining) extracted.destination = remaining.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (!extracted.source && extracted.destination) {
      const remaining = foundCities.find(c => !c.includes(extracted.destination.toLowerCase()));
      if (remaining) extracted.source = remaining.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  } else if (foundCities.length === 1) {
    // Only one city found, try to place it
    const city = foundCities[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (/(?:to|towards|reach|going to|destination)\s/i.test(lower)) {
      extracted.destination = city;
    } else {
      extracted.source = city;
    }
  }

  // --- Date ---
  const datePatterns = [
    { re: /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/, fn: (m) => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
    { re: /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/, fn: (m) => `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` },
    { re: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(\d{4})?/i, fn: (m) => {
      const months = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
      const yr = m[3] || new Date().getFullYear();
      return `${yr}-${months[m[2].toLowerCase().slice(0,3)]}-${m[1].padStart(2,'0')}`;
    }},
  ];

  for (const { re, fn } of datePatterns) {
    const m = lower.match(re);
    if (m) { extracted.travelDate = fn(m); break; }
  }

  if (!extracted.travelDate) {
    const today = new Date();
    if (/\btoday\b/.test(lower)) {
      extracted.travelDate = today.toISOString().split('T')[0];
    } else if (/\btomorrow\b/.test(lower)) {
      today.setDate(today.getDate() + 1);
      extracted.travelDate = today.toISOString().split('T')[0];
    } else if (/\bnext week\b/.test(lower)) {
      today.setDate(today.getDate() + 7);
      extracted.travelDate = today.toISOString().split('T')[0];
    }
  }

  // --- Traveler count ---
  const numMatch = lower.match(/(\d+)\s+(?:people|persons?|travelers?|passengers?|friends?|colleagues?|members?|of us)/);
  if (numMatch) {
    extracted.travelerCount = parseInt(numMatch[1]);
  } else {
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      if (lower.includes(word + ' people') || lower.includes(word + ' of us') || lower.includes(word + ' person')) {
        extracted.travelerCount = num;
        break;
      }
    }
  }

  // --- Purpose ---
  for (const [purpose, keywords] of Object.entries(PURPOSE_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      extracted.purpose = purpose;
      break;
    }
  }

  // --- Preference ---
  for (const [pref, keywords] of Object.entries(PREFERENCE_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      extracted.preference = pref;
      break;
    }
  }

  return extracted;
};

const buildReply = (extracted, originalText) => {
  const parts = [];
  if (extracted.source)       parts.push(`📍 From: **${extracted.source}**`);
  if (extracted.destination)  parts.push(`🏁 To: **${extracted.destination}**`);
  if (extracted.travelDate)   parts.push(`📅 Date: **${extracted.travelDate}**`);
  if (extracted.travelerCount) parts.push(`👤 Travelers: **${extracted.travelerCount}**`);
  if (extracted.purpose)      parts.push(`🎯 Purpose: **${extracted.purpose}**`);
  if (extracted.preference)   parts.push(`⚡ Preference: **${extracted.preference}**`);

  if (parts.length === 0) {
    return `I didn't catch enough details. Try something like:\n"I need to travel from Jalandhar to Patna on 15 May for 2 people, business trip, prefer cheapest."`;
  }

  return `Got it! I've filled in the planner form for you:\n\n${parts.join('\n')}\n\nHit **Generate Journey Options** to see ranked travel plans! 🚀`;
};

export const handleChatQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: 'Please provide a message.' });
    }

    const extractedData = parseNaturalLanguage(message);
    const reply = buildReply(extractedData, message);

    return res.status(200).json({ reply, extractedData });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ reply: 'Sorry, I am having trouble understanding you right now.' });
  }
};

