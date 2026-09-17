import { useSession } from '../features/auth/useSession';
import { LoginPage } from '../features/auth/LoginPage';
import { CheckInPage } from '../features/checkin/CheckInPage';
import { useConnectivity } from '../hooks/useConnectivity';

export function App() {
  const { user, isAuthenticated, isLoading, logout } = useSession();
  const isOnline = useConnectivity();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-3 text-sm text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <CheckInPage userEmail={user?.email} onLogout={logout} isOnline={isOnline} />;
}
