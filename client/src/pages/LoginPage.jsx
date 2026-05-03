import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

function LoginPage() {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/trip-planner');
  };

  return <AuthForm mode="login" onAuthSuccess={handleAuthSuccess} />;
}

export default LoginPage;
