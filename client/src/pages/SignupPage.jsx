import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

function SignupPage() {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/login');
  };

  return <AuthForm mode="signup" onAuthSuccess={handleAuthSuccess} />;
}

export default SignupPage;
