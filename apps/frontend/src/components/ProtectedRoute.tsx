import { useVerifyQuery } from '@/store/auth-slice';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import PageLoader from '@/components/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isLoading, isError, isSuccess } = useVerifyQuery();

  useEffect(() => {
    if (isError) navigate('/login', { replace: true });
  }, [isError, navigate]);

  if (isLoading) return <PageLoader />;

  if (isError) return null; // Will redirect in useEffect

  if (isSuccess) return <>{children}</>;

  return null;
}
