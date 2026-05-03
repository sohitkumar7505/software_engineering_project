import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TripPlannerPage from './pages/TripPlannerPage';
import BookingOptionsPage from './pages/BookingOptionsPage';
import JourneyTrackerPage from './pages/JourneyTrackerPage';

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="app-shell"><p>Loading...</p></div>;
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <h1 className="brand-title">
          <span className="logo-mark">TWT</span>
          <span>Travel without tension</span>
        </h1>
        <nav>
          {!user ? (
            <>
              <Link to="/signup">Signup</Link>
              <Link to="/login">Login</Link>
            </>
          ) : (
            <>
              <span className="welcome-text">Hello, {user.name}</span>
              <Link to="/trip-planner">Trip Planner</Link>
              <Link to="/tracker">Live Tracker</Link>
              <button onClick={logout} className="logout-btn">Logout</button>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/trip-planner' : '/signup'} replace />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/trip-planner" replace />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/trip-planner" replace />} />
          <Route path="/trip-planner" element={user ? <TripPlannerPage /> : <Navigate to="/login" replace />} />
          <Route path="/book/:journeyId/:optionId" element={user ? <BookingOptionsPage /> : <Navigate to="/login" replace />} />
          <Route path="/tracker" element={user ? <JourneyTrackerPage /> : <Navigate to="/login" replace />} />
          <Route path="/search-journey" element={<Navigate to="/trip-planner" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
