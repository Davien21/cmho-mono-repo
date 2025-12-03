import { useNavigate } from 'react-router-dom';
import { Package, Wallet, ArrowRight, LogOut } from 'lucide-react';
import { useLogoutMutation } from '@/store/auth-slice';

export default function AppSelectionPage() {
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const apps = [
    {
      id: 'salary',
      name: 'CMHO Admin Manager',
      description: 'Manage employee salaries and payments',
      icon: Wallet,
      path: '/salary',
      available: true,
      color: 'blue',
    },
    {
      id: 'inventory-manager',
      name: 'CMHO Inventory Manager',
      description: 'Track and manage inventory',
      icon: Package,
      path: '/inventory',
      available: true,
      color: 'green',
    },
  ];

  const handleAppSelect = (app: (typeof apps)[0]) => {
    if (app.available) {
      navigate(app.path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <div className="max-w-7xl mx-auto relative">
        {/* Header - CMHO on left, Logout on right */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">CMHO</h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Main content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {apps.map((app) => {
              const Icon = app.icon;
              const colorClasses = {
                blue: {
                  bg: 'bg-blue-500',
                  text: 'text-white',
                  hover: 'hover:shadow-2xl hover:-translate-y-1',
                  button: 'bg-blue-600 hover:bg-blue-700',
                },
                green: {
                  bg: 'bg-green-500',
                  text: 'text-white',
                  hover: 'hover:shadow-2xl hover:-translate-y-1',
                  button: 'bg-green-600 hover:bg-green-700',
                },
              };
              const colors = colorClasses[app.color as keyof typeof colorClasses];

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl shadow-lg p-8 transition-all duration-200 ${
                    app.available
                      ? `${colors.hover} cursor-pointer`
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => handleAppSelect(app)}
                >
                  <div className="flex flex-col h-full">
                    {/* Icon and name side by side */}
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`w-8 h-8 ${colors.text}`} />
                      </div>
                      <h2
                        className={`text-2xl font-bold ${
                          app.available ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {app.name}
                      </h2>
                    </div>

                    {/* Description below */}
                    <p className="text-gray-600 mb-8 flex-grow text-sm">{app.description}</p>

                    {app.available ? (
                      <button
                        className={`w-full ${colors.button} text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
                      >
                        Open Application
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="w-full bg-gray-200 text-gray-500 font-semibold py-3 px-4 rounded-lg text-center">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
