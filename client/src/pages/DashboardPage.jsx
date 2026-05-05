import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const STATUS_CONFIG = {
  PLANNED:   { label: 'Planned',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', dot: '#8b5cf6' },
  BOOKED:    { label: 'Active',    color: '#2563eb', bg: 'rgba(37,99,235,0.12)',   dot: '#2563eb' },
  COMPLETED: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,0.12)',   dot: '#059669' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   dot: '#dc2626' },
};

const MODE_ICON = { cab: '🚖', auto: '🛺', train: '🚆', flight: '✈️', bus: '🚌' };
const getModeIcon = (mode = '') => {
  const lower = mode.toLowerCase();
  for (const key of Object.keys(MODE_ICON)) if (lower.includes(key)) return MODE_ICON[key];
  return '🚗';
};

function StatCard({ icon, label, value, color = '#007f73' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      border: '1px solid rgba(0,127,115,0.15)',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      flex: '1 1 180px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.82rem', color: '#5a6b7e', marginTop: '0.15rem', fontWeight: '600' }}>{label}</div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const { data } = await axios.get(`${API_URL}/api/v1/planner/journeys`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJourneys(data.journeys || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load journeys.');
      } finally {
        setLoading(false);
      }
    };
    fetchJourneys();
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(0,127,115,0.2)', borderTop: '4px solid #007f73', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#5a6b7e', fontWeight: '600' }}>Loading your journeys...</p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  const stats = {
    total: journeys.length,
    active: journeys.filter(j => j.status === 'BOOKED').length,
    completed: journeys.filter(j => j.status === 'COMPLETED').length,
    totalSpent: journeys
      .filter(j => j.bookingRef)
      .reduce((sum, j) => {
        const opt = j.options?.find(o => o.optionId === j.selectedOptionId);
        return sum + (opt?.totalCost || 0);
      }, 0),
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>My Dashboard</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>All your TWT journeys at a glance</p>
        </div>
        <button
          onClick={() => navigate('/trip-planner')}
          style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem', borderRadius: '10px', fontWeight: '700', background: '#fff', color: '#007f73', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
        >
          ＋ Plan New Trip
        </button>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard icon="✈️" label="Total Journeys" value={stats.total} color="#007f73" />
        <StatCard icon="🔵" label="Active Bookings" value={stats.active} color="#2563eb" />
        <StatCard icon="✅" label="Completed" value={stats.completed} color="#059669" />
        <StatCard icon="💰" label="Total Spent" value={stats.totalSpent > 0 ? `₹${stats.totalSpent.toLocaleString('en-IN')}` : '—'} color="#b45309" />
      </div>

      {/* Journey List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Journey History</h3>
          <span style={{ fontSize: '0.85rem', color: '#5a6b7e', fontWeight: '600' }}>{journeys.length} trip{journeys.length !== 1 ? 's' : ''}</span>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {journeys.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✈️</div>
            <h3 style={{ color: '#1f2f3f' }}>No journeys yet</h3>
            <p style={{ color: '#5a6b7e' }}>Plan your first trip and it will appear here.</p>
            <button onClick={() => navigate('/trip-planner')} style={{ marginTop: '1rem' }}>Plan a Trip</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {journeys.map((journey) => {
            const statusCfg = STATUS_CONFIG[journey.status] || STATUS_CONFIG.PLANNED;
            const selectedOption = journey.options?.find(o => o.optionId === journey.selectedOptionId);
            const legs = selectedOption?.legs || [];
            const travelDateFormatted = journey.travelDate
              ? new Date(journey.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';

            return (
              <article
                key={journey._id}
                style={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'default',
                  background: '#fff',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Status colour strip at top */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${statusCfg.dot}, ${statusCfg.dot}88)` }} />

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f2740' }}>
                          {journey.source} → {journey.destination}
                        </h4>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.7rem', borderRadius: '999px',
                          fontSize: '0.76rem', fontWeight: '700',
                          background: statusCfg.bg, color: statusCfg.color,
                          border: `1px solid ${statusCfg.color}33`,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.dot, display: 'inline-block' }} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.84rem', color: '#5a6b7e', flexWrap: 'wrap' }}>
                        <span>📅 {travelDateFormatted}</span>
                        <span>👥 {journey.travelerCount} traveler{journey.travelerCount !== 1 ? 's' : ''}</span>
                        {journey.bookingRef && <span style={{ fontWeight: '700', color: '#007f73' }}>🏷️ {journey.bookingRef}</span>}
                      </div>
                    </div>

                    {selectedOption && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#007f73', lineHeight: 1 }}>
                          ₹{selectedOption.totalCost.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#5a6b7e', marginTop: '0.1rem' }}>Total cost</div>
                        <div style={{ fontSize: '0.75rem', color: '#5a6b7e' }}>₹{selectedOption.costPerPerson.toLocaleString('en-IN')}/person</div>
                      </div>
                    )}
                  </div>

                  {/* Leg timeline */}
                  {legs.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {legs.map((leg, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{
                            background: 'rgba(0,127,115,0.07)',
                            border: '1px solid rgba(0,127,115,0.18)',
                            borderRadius: '8px',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#0f2740',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}>
                            <span>{getModeIcon(leg.mode)}</span>
                            <span>{leg.mode}</span>
                          </div>
                          {i < legs.length - 1 && <span style={{ color: '#c8dae9', fontWeight: '700', fontSize: '0.85rem' }}>›</span>}
                        </div>
                      ))}
                      {selectedOption && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#5a6b7e' }}>
                          ⏱ {Math.floor(selectedOption.totalTimeMins / 60)}h {selectedOption.totalTimeMins % 60}m
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem', alignItems: 'center' }}>
                    {journey.status === 'BOOKED' && (
                      <button
                        id={`track-btn-${journey._id}`}
                        onClick={() => navigate(`/tracker/${journey._id}`)}
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.88rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        📍 Track Live
                      </button>
                    )}
                    {journey.status === 'COMPLETED' && (
                      <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🎉 Journey Complete
                      </span>
                    )}
                    {journey.status === 'PLANNED' && (
                      <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: '600' }}>
                        📋 Plan Generated — awaiting booking
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
    </div>
  );
}

export default DashboardPage;
