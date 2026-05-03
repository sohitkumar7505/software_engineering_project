import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthForm({ mode, onAuthSuccess }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (isSignup && !formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setMessage('');

    const result = isSignup
      ? await signup(formData.name, formData.email, formData.password)
      : await login(formData.email, formData.password);

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Authentication failed.');
      return;
    }

    setMessage(isSignup ? 'Signup successful.' : 'Login successful.');
    if (onAuthSuccess) {
      onAuthSuccess(result.user);
    }
  };

  return (
    <section className="auth-experience">
      <aside className="auth-visual card">
        <div className="brand-badge">Travel without tension</div>
        <h2>Design every journey like a local expert</h2>
        <p>
          Plan transport, timing, and destination stops with one smooth flow made for travelers.
        </p>
        <ul>
          <li>Smart route suggestions with day-wise timing</li>
          <li>Realistic budget ranges for India travel</li>
          <li>Quick planning from source to destination</li>
        </ul>
        <div className="auth-stats">
          <article>
            <strong>1,800+</strong>
            <span>Plans created</span>
          </article>
          <article>
            <strong>95%</strong>
            <span>User satisfaction</span>
          </article>
        </div>
      </aside>

      <section className="card auth-card">
        <div className="auth-logo">
          <span className="logo-mark">TWT</span>
          <div>
            <strong>Travel without tension</strong>
            <p>Travel planning companion</p>
          </div>
        </div>

        <h3>{isSignup ? 'Create your traveler account' : 'Welcome back traveler'}</h3>
        <p>{isSignup ? 'Sign up and start planning smart journeys.' : 'Login and continue your journey planning.'}</p>

        <form onSubmit={handleSubmit} className="form-grid">
          {isSignup && (
            <label>
              Full Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Sohit Kumar"
                className={validationErrors.name ? 'error' : ''}
              />
              {validationErrors.name && <span className="field-error">{validationErrors.name}</span>}
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={validationErrors.email ? 'error' : ''}
            />
            {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={validationErrors.password ? 'error' : ''}
            />
            {validationErrors.password && <span className="field-error">{validationErrors.password}</span>}
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>

        <p className="switch-auth">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Login here' : 'Signup here'}</Link>
        </p>

        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}
      </section>
    </section>
  );
}

export default AuthForm;
