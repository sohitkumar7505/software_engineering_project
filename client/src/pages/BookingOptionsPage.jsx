import { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

function BookingOptionsPage() {
  const { journeyId, optionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { journey, selectedOption } = location.state || {};

  const [bookingState, setBookingState] = useState({ loading: false, bookingRef: '', message: '', segments: [] });
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const vehicles = useMemo(() => {
    if (!selectedOption) return [];

    const isTrain = optionId.includes('TRAIN');
    const isFlight = optionId.includes('FLIGHT');
    const isBus = optionId.includes('BUS');
    const isCar = optionId.includes('CAR');

    const baseCost = selectedOption.costPerPerson;

    if (isTrain) {
      return [
        { id: 'T1', name: 'Shatabdi Express', departure: '06:00 AM', arrival: '11:45 AM', type: 'Chair Car', cost: baseCost + 150 },
        { id: 'T2', name: 'Rajdhani Express', departure: '04:30 PM', arrival: '09:15 PM', type: '3AC', cost: baseCost },
        { id: 'T3', name: 'Garib Rath Express', departure: '10:00 PM', arrival: '04:00 AM', type: '3AC Economy', cost: baseCost - 200 }
      ];
    }

    if (isFlight) {
      return [
        { id: 'F1', name: 'IndiGo 6E-212', departure: '08:00 AM', arrival: '09:30 AM', type: 'Economy', cost: baseCost - 500 },
        { id: 'F2', name: 'Air India AI-505', departure: '12:15 PM', arrival: '01:45 PM', type: 'Economy', cost: baseCost + 300 },
        { id: 'F3', name: 'Vistara UK-991', departure: '06:00 PM', arrival: '07:30 PM', type: 'Premium Economy', cost: baseCost + 1200 }
      ];
    }

    if (isBus) {
      return [
        { id: 'B1', name: 'Zingbus AC Sleeper', departure: '09:00 PM', arrival: '05:00 AM', type: 'Volvo AC Sleeper', cost: baseCost },
        { id: 'B2', name: 'IntrCity SmartBus', departure: '10:30 PM', arrival: '06:30 AM', type: 'AC Seater/Sleeper', cost: baseCost - 100 },
        { id: 'B3', name: 'RedBus Premium', departure: '11:15 PM', arrival: '07:00 AM', type: 'AC Multi-Axle', cost: baseCost + 150 }
      ];
    }

    if (isCar) {
      return [
        { id: 'C1', name: 'Ola Outstation', departure: 'Anytime', arrival: 'Flexible', type: 'Sedan', cost: baseCost },
        { id: 'C2', name: 'Uber Intercity', departure: 'Anytime', arrival: 'Flexible', type: 'SUV', cost: baseCost + 1500 },
        { id: 'C3', name: 'MakeMyTrip Cabs', departure: 'Anytime', arrival: 'Flexible', type: 'Hatchback', cost: baseCost - 800 }
      ];
    }

    return [];
  }, [optionId, selectedOption]);

  if (!journey || !selectedOption) {
    return (
      <div className="app-shell">
        <div className="card">
          <h2>Error</h2>
          <p>Journey details not found. Please go back and plan your trip again.</p>
          <button onClick={() => navigate('/trip-planner')}>Back to Planner</button>
        </div>
      </div>
    );
  }

  const handleConfirmBooking = async () => {
    if (!selectedVehicleId) {
      setError('Please select a specific option to book.');
      return;
    }

    setBookingState({ loading: true, bookingRef: '', message: '' });
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.post(
        `${API_URL}/api/v1/planner/book`,
        {
          journeyId,
          optionId
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      setBookingState({
        loading: false,
        bookingRef: data.bookingRef,
        message: data.message,
        segments: data.segments || []
      });
    } catch (err) {
      setBookingState({ loading: false, bookingRef: '', message: '', segments: [] });
      setError(err.response?.data?.message || 'Booking failed.');
    }
  };

  return (
    <div className="planner-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <section className="card planner-card">
        <button onClick={() => navigate('/trip-planner')} className="back-btn" style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          &larr; Back to Journey Options
        </button>
        
        <div className="planner-header">
          <h3>Available Options for {selectedOption.label}</h3>
          <p>Select your preferred operator and timings to confirm your booking.</p>
        </div>

        {bookingState.message ? (
          <div className="booking-success" style={{ margin: '2rem 0' }}>
            <h2>Booking Confirmed! 🎉</h2>
            <p>{bookingState.message}</p>
            {bookingState.bookingRef && <h3>Main Booking Ref: {bookingState.bookingRef}</h3>}
            
            {bookingState.segments && bookingState.segments.length > 0 && (
              <div style={{ marginTop: '2rem', textAlign: 'left', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px' }}>
                <h4>Confirmed Segments</h4>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                  {bookingState.segments.map((segment, index) => (
                    <li key={segment._id || index} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{segment.mode}</strong>
                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{segment.status}</span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0' }}>{segment.from} &rarr; {segment.to}</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                        Ref: {segment.bookingRef} | Cost: INR {segment.costPerPerson}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button onClick={() => navigate('/trip-planner')} style={{ marginTop: '2rem' }}>Plan Another Trip</button>
          </div>
        ) : (
          <>
            <div className="options-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
              {vehicles.map((vehicle) => (
                <article 
                  key={vehicle.id} 
                  className={`option-card ${selectedVehicleId === vehicle.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedVehicleId === vehicle.id ? '2px solid var(--accent-color)' : '',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>{vehicle.name} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({vehicle.type})</span></h4>
                    <p style={{ margin: 0 }}><strong>Departure:</strong> {vehicle.departure} | <strong>Arrival:</strong> {vehicle.arrival}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--accent-color)' }}>
                      INR {vehicle.cost}
                    </p>
                    <input 
                      type="radio" 
                      checked={selectedVehicleId === vehicle.id} 
                      onChange={() => setSelectedVehicleId(vehicle.id)} 
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </article>
              ))}
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleConfirmBooking} 
                disabled={!selectedVehicleId || bookingState.loading}
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
              >
                {bookingState.loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default BookingOptionsPage;
