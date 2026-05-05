import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

function JourneyTrackerPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  const fetchJourney = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      let url;
      if (journeyId) {
        // Fetch a specific journey by ID
        url = `${API_URL}/api/v1/planner/journeys/${journeyId}`;
      } else {
        // Fallback: most recent active journey
        url = `${API_URL}/api/v1/planner/journeys/active`;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJourneyData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Journey not found. Go plan a trip!');
      } else {
        setError('Failed to load journey details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [journeyId]);


  const showNotification = (msg) => {
    if (!msg) return;
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleSimulate = async (segmentId, action) => {
    try {
      const token = localStorage.getItem('authToken');
      const { data } = await axios.patch(
        `${API_URL}/api/v1/planner/segments/${segmentId}/simulate`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.notification) {
        showNotification(data.notification);
      }
      fetchJourney();
    } catch (err) {
      alert(err.response?.data?.message || 'Simulation failed');
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading tracker...</p>
        </div>
      </div>
    );
  }

  if (error || !journeyData) {
    return (
      <div className="app-shell">
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
          <h2>Journey Tracker</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>View Dashboard</button>
            <button onClick={() => navigate('/trip-planner')}>Plan a Trip</button>
          </div>
        </div>
      </div>
    );
  }

  const { journey, segments } = journeyData;
  const isJourneyComplete = journey.status === 'COMPLETED';

  return (
    <div className="planner-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <section className="card planner-card" style={{ position: 'relative' }}>
        
        {notification && (
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent-color)', color: '#fff', padding: '1rem 2rem', 
            borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold', animation: 'fadeInDown 0.3s ease-out'
          }}>
            🔔 {notification}
          </div>
        )}

        <div className="planner-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ marginBottom: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Back to Dashboard
            </button>
            <h3 style={{ margin: 0 }}>Live Tracker</h3>
            <p style={{ margin: '0.25rem 0 0' }}>Booking Ref: <strong>{journey.bookingRef}</strong></p>
            <p style={{ margin: '0.25rem 0 0' }}>Route: {journey.source} &rarr; {journey.destination}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'inline-block' }}>
              <strong>Wallet Balance:</strong> INR {journeyData.walletBalance}
            </div>
            <br />
            {!isJourneyComplete && (
              <button
                onClick={async () => {
                  if (!navigator.geolocation) {
                    showNotification('Geolocation is not supported by your browser.');
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                      // Copy to clipboard
                      navigator.clipboard.writeText(mapsUrl).then(() => {
                        showNotification(`📍 Location link copied! Share it: ${mapsUrl}`);
                      }).catch(() => {
                        showNotification(`📍 Your location: ${mapsUrl}`);
                      });
                    },
                    (err) => {
                      if (err.code === 1) showNotification('⚠️ Location permission denied. Please allow access in your browser settings.');
                      else showNotification('⚠️ Unable to get location. Please try again.');
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                style={{ background: 'var(--accent-color)', color: '#fff', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                📍 Share Live Location
              </button>
            )}
          </div>
        </div>
        {isJourneyComplete && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-color)', color: '#fff', borderRadius: '4px' }}>
            <strong>🎉 Journey Completed!</strong>
          </div>
        )}

        <div style={{ marginTop: '2rem', position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical line connecting nodes */}
          <div style={{
            position: 'absolute', top: '0', bottom: '0', left: '31px', width: '2px',
            background: 'var(--border-color)', zIndex: 0
          }} />

          {segments.map((segment, index) => {
            const isActive = segment.status === 'IN_PROGRESS';
            const isCompleted = segment.status === 'COMPLETED';
            const isOnHold = segment.status === 'ON_HOLD';
            const isPending = segment.status === 'PENDING';

            let nodeColor = 'var(--border-color)';
            if (isCompleted) nodeColor = 'var(--success-color)';
            if (isActive) nodeColor = 'var(--accent-color)';

            const progressPercent = Math.min(100, Math.round((segment.elapsedMins / segment.durationMins) * 100));

            return (
              <div key={segment._id} style={{ position: 'relative', marginBottom: '2rem', zIndex: 1 }}>
                
                {/* Node Dot */}
                <div style={{
                  position: 'absolute', left: '-27px', top: '16px', width: '20px', height: '20px',
                  borderRadius: '50%', background: nodeColor, border: '4px solid var(--surface-color)',
                  boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none'
                }} />

                <article style={{
                  padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '8px',
                  border: `1px solid ${isActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  opacity: isOnHold ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{segment.mode}</h4>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold',
                      background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-color)',
                      color: isCompleted ? 'var(--success-color)' : isActive ? 'var(--accent-color)' : 'var(--text-secondary)'
                    }}>
                      {segment.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Route:</strong> {segment.from} &rarr; {segment.to}</p>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Ref: {segment.bookingRef} | Cost: INR {segment.costPerPerson} | Est: {segment.durationMins} mins
                  </p>

                  {(isActive || isCompleted || isPending) && (
                    <div style={{ background: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ height: '100%', width: `${progressPercent}%`, background: isCompleted ? 'var(--success-color)' : 'var(--accent-color)', transition: 'width 0.3s ease' }} />
                    </div>
                  )}

                  {(isActive || isPending) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      {isActive && (
                        <>
                          <button 
                            onClick={() => handleSimulate(segment._id, 'progress')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          >
                            +10 Mins
                          </button>
                          <button 
                            onClick={() => handleSimulate(segment._id, 'complete')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--success-color)' }}
                          >
                            Mark Arrived
                          </button>
                          <button 
                            onClick={() => handleSimulate(segment._id, 'delay')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#eab308' }}
                          >
                            Simulate Delay
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleSimulate(segment._id, 'cancel')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#ef4444' }}
                      >
                        Cancel Leg
                      </button>
                    </div>
                  )}
                  
                  {isOnHold && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                      * Waiting for previous leg to reach 80% completion before confirming to avoid wait charges.
                    </p>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}} />
    </div>
  );
}

export default JourneyTrackerPage;
