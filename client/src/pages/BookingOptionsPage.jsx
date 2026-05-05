import { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

    // Find the main leg to get realistic duration for the vehicle
    const mainLeg = selectedOption.legs.find(l => 
      l.mode.toLowerCase().includes('train') || 
      l.mode.toLowerCase().includes('flight') || 
      l.mode.toLowerCase().includes('bus')
    ) || selectedOption.legs[0];
    
    const durationMins = mainLeg ? mainLeg.durationMins : 120;

    const calculateArrival = (departureStr) => {
      if (departureStr === 'Anytime') return `+${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
      
      const match = departureStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 'Flexible';
      
      let hours = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const isPM = match[3].toUpperCase() === 'PM';
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const totalMins = hours * 60 + mins + durationMins;
      
      const finalHours24 = Math.floor(totalMins / 60) % 24;
      const finalMins = totalMins % 60;
      const nextDay = Math.floor(totalMins / (24 * 60)) > 0 ? ' (+1 Day)' : '';
      
      const finalIsPM = finalHours24 >= 12;
      let finalHours12 = finalHours24 % 12;
      if (finalHours12 === 0) finalHours12 = 12;
      
      const paddedMins = finalMins.toString().padStart(2, '0');
      const ampm = finalIsPM ? 'PM' : 'AM';
      
      return `${finalHours12.toString().padStart(2, '0')}:${paddedMins} ${ampm}${nextDay}`;
    };

    if (isTrain) {
      return [
        { id: 'T1', name: 'Shatabdi Express', departure: '06:00 AM', arrival: calculateArrival('06:00 AM'), type: 'Chair Car', cost: baseCost + 150 },
        { id: 'T2', name: 'Rajdhani Express', departure: '04:30 PM', arrival: calculateArrival('04:30 PM'), type: '3AC', cost: baseCost },
        { id: 'T3', name: 'Garib Rath Express', departure: '10:00 PM', arrival: calculateArrival('10:00 PM'), type: '3AC Economy', cost: baseCost - 200 }
      ];
    }

    if (isFlight) {
      return [
        { id: 'F1', name: 'IndiGo 6E-212', departure: '08:00 AM', arrival: calculateArrival('08:00 AM'), type: 'Economy', cost: baseCost - 500 },
        { id: 'F2', name: 'Air India AI-505', departure: '12:15 PM', arrival: calculateArrival('12:15 PM'), type: 'Economy', cost: baseCost + 300 },
        { id: 'F3', name: 'Vistara UK-991', departure: '06:00 PM', arrival: calculateArrival('06:00 PM'), type: 'Premium Economy', cost: baseCost + 1200 }
      ];
    }

    if (isBus) {
      return [
        { id: 'B1', name: 'Zingbus AC Sleeper', departure: '09:00 PM', arrival: calculateArrival('09:00 PM'), type: 'Volvo AC Sleeper', cost: baseCost },
        { id: 'B2', name: 'IntrCity SmartBus', departure: '10:30 PM', arrival: calculateArrival('10:30 PM'), type: 'AC Seater/Sleeper', cost: baseCost - 100 },
        { id: 'B3', name: 'RedBus Premium', departure: '11:15 PM', arrival: calculateArrival('11:15 PM'), type: 'AC Multi-Axle', cost: baseCost + 150 }
      ];
    }

    if (isCar) {
      return [
        { id: 'C1', name: 'Ola Outstation', departure: 'Anytime', arrival: calculateArrival('Anytime'), type: 'Sedan', cost: baseCost },
        { id: 'C2', name: 'Uber Intercity', departure: 'Anytime', arrival: calculateArrival('Anytime'), type: 'SUV', cost: baseCost + 1500 },
        { id: 'C3', name: 'MakeMyTrip Cabs', departure: 'Anytime', arrival: calculateArrival('Anytime'), type: 'Hatchback', cost: baseCost - 800 }
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

  const handlePaymentAndBooking = async () => {
    if (!selectedVehicleId) {
      setError('Please select a specific option to book.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    setBookingState({ loading: true, bookingRef: '', message: '', segments: [] });
    setError('');

    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // 1. Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        setBookingState({ loading: false, bookingRef: '', message: '', segments: [] });
        setError('Razorpay SDK failed to load. Please check your connection.');
        return;
      }

      // 2. Create order
      const { data: orderData } = await axios.post(`${API_URL}/api/v1/payment/create-order`, {
        amount: vehicle.cost
      }, { headers });

      // 3. Configure Razorpay modal
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Travel Without Tension',
        description: `Booking for ${vehicle.name}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment
            await axios.post(`${API_URL}/api/v1/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, { headers });

            // 5. Create Booking if payment verified
            handleConfirmBooking();
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
            setBookingState({ loading: false, bookingRef: '', message: '', segments: [] });
          }
        },
        prefill: {
          name: 'Traveler',
          email: 'traveler@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response) {
        setError(response.error.description);
        setBookingState({ loading: false, bookingRef: '', message: '', segments: [] });
      });

      // Handle modal close without payment
      paymentObject.on('modal.closed', function () {
        if (bookingState.loading && !bookingState.bookingRef) {
           setBookingState(prev => ({ ...prev, loading: false }));
        }
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment.');
      setBookingState({ loading: false, bookingRef: '', message: '', segments: [] });
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
                onClick={handlePaymentAndBooking} 
                disabled={!selectedVehicleId || bookingState.loading}
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
              >
                {bookingState.loading ? 'Processing...' : 'Pay & Confirm Booking'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default BookingOptionsPage;
