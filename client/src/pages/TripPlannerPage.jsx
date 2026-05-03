import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIChatbot from '../components/AIChatbot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
const DESTINATION_THEMES = ['Beach Escapes', 'Hill Retreats', 'City Heritage', 'Food Trails'];

function TripPlannerPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    travelDate: '',
    travelTime: '',
    purpose: 'leisure',
    travelerCount: 1,
    preference: 'balanced',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [journey, setJourney] = useState(null);
  const [bookingState, setBookingState] = useState({ loading: false, bookingRef: '', message: '' });

  const canSubmit = useMemo(
    () =>
      formData.source.trim() &&
      formData.destination.trim() &&
      formData.travelDate &&
      Number(formData.travelerCount) >= 1,
    [formData]
  );

  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'travelerCount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const selectedDate = new Date(formData.travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('The selected journey date has already passed. No journey is possible on this date.');
      setError('Please select a valid future date for your journey.');
      return;
    }

    if (Number(formData.travelerCount) < 1) {
      setError('Traveler count must be at least 1.');
      return;
    }

    setLoading(true);
    setError('');
    setBookingState({ loading: false, bookingRef: '', message: '' });

    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(`${API_URL}/api/v1/planner/generate`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setJourney(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate travel plan right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (optionId) => {
    if (!journey?.journeyId) return;

    const selectedOption = journey.options.find(opt => opt.optionId === optionId);
    if (!selectedOption) return;

    navigate(`/book/${journey.journeyId}/${optionId}`, { 
      state: { journey, selectedOption } 
    });
  };

  const handleUpdateForm = (extractedData) => {
    setFormData((prev) => ({
      ...prev,
      ...extractedData
    }));
  };

  return (
    <section className="planner-layout">
      <aside className="planner-hero card">
        <div className="planner-badge">Travel Planning Studio</div>
        <h2>Book journeys like a real travel platform</h2>
        <p>
          From first-mile auto/cab to train or flight and last-mile drop, get ranked options by
          cheapest, fastest, or balanced preferences.
        </p>

        <div className="theme-pills">
          {DESTINATION_THEMES.map((theme) => (
            <span key={theme}>{theme}</span>
          ))}
        </div>

        <div className="hero-image-grid">
          <article className="hero-tile sea">Coastal Day</article>
          <article className="hero-tile city">Old City Walk</article>
          <article className="hero-tile hill">Mountain Escape</article>
        </div>
      </aside>

      <section className="card planner-card">
        <div className="planner-header">
          <h3>Generate & Book Journey</h3>
          <p>Example route: NIT Jalandhar to NIT Delhi with multimodal travel options.</p>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">
          <label>
            Source
            <input
              type="text"
              name="source"
              placeholder="NIT Jalandhar"
              value={formData.source}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Destination
            <input
              type="text"
              name="destination"
              placeholder="NIT Delhi"
              value={formData.destination}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Time
            <input
              type="time"
              name="travelTime"
              value={formData.travelTime}
              onChange={handleChange}
            />
          </label>

          <label>
            Purpose Of Journey
            <select name="purpose" value={formData.purpose} onChange={handleChange}>
              <option value="business">Business</option>
              <option value="leisure">Leisure</option>
              <option value="emergency">Emergency</option>
              <option value="family trip">Family Trip</option>
            </select>
          </label>

          <label>
            Number Of Travelers
            <input
              type="number"
              min="1"
              name="travelerCount"
              value={formData.travelerCount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Preference
            <select name="preference" value={formData.preference} onChange={handleChange}>
              <option value="fastest">Fastest</option>
              <option value="cheapest">Cheapest</option>
              <option value="balanced">Balanced</option>
            </select>
          </label>

          <label>
            Additional Notes
            <textarea
              name="notes"
              placeholder="Any special requests or details about your journey..."
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? 'Generating Routes...' : 'Generate Journey Options'}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        {bookingState.message && (
          <div className="booking-success">
            <strong>{bookingState.message}</strong>
            {bookingState.bookingRef && <p>Booking Ref: {bookingState.bookingRef}</p>}
          </div>
        )}

        {journey && (
          <article className="plan-output">
            <div className="plan-title-row">
              <h3>{journey.source} to {journey.destination}</h3>
              <span className="source-chip">Recommended: {journey.recommendedOptionId}</span>
            </div>

            <div className="plan-block">
              <h4>Chatbot Flow</h4>
              <ul>
                {journey.chatFlow?.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="plan-block">
              <h4>Smart Recommendations</h4>
              <ul>
                {journey.recommendations?.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="options-grid">
              {journey.options?.map((option) => (
                <article key={option.optionId} className="option-card">
                  <div className="option-head">
                    <h4>{option.label}</h4>
                    {option.optionId === journey.recommendedOptionId && <span>Top Pick</span>}
                  </div>

                  <p>{option.reason}</p>

                  <div className="option-metrics">
                    <p><strong>Total Time:</strong> {formatDuration(option.totalTimeMins)}</p>
                    <p><strong>Cost / Person:</strong> INR {option.costPerPerson}</p>
                    <p><strong>Total Cost:</strong> INR {option.totalCost}</p>
                  </div>

                  <div className="leg-list">
                    {option.legs?.map((leg, index) => (
                      <div key={`${option.optionId}-${index}`} className="leg-item">
                        <strong>{leg.mode}</strong>
                        <p>{leg.from} &rarr; {leg.to}</p>
                        <p>{formatDuration(leg.durationMins)} | INR {leg.costPerPerson} / person</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="book-btn"
                    onClick={() => handleBook(option.optionId)}
                    disabled={bookingState.loading}
                  >
                    {bookingState.loading ? 'Booking...' : `Book ${option.optionId}`}
                  </button>
                </article>
              ))}
            </div>
          </article>
        )}
      </section>
      <AIChatbot onUpdateForm={handleUpdateForm} />
    </section>
  );
}

export default TripPlannerPage;
