import { useNavigate } from "react-router-dom";
import { Package, Wallet, ArrowRight, LogOut, Sparkles } from "lucide-react";
import { useLogoutMutation } from "@/store/auth-slice";

export default function AppSelectionPage() {
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const apps = [
    {
      id: "salary",
      name: "Admin Manager",
      description:
        "Manage employee salaries, payments, and administrative operations",
      icon: Wallet,
      path: "/admin",
      available: true,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      glowColor: "blue",
      features: [
        "Salary Processing",
        "Payment Tracking",
        "Employee Management",
      ],
    },
    {
      id: "inventory-manager",
      name: "Inventory Manager",
      description: "Track inventory, manage stock levels, and monitor supplies",
      icon: Package,
      path: "/inventory",
      available: true,
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      glowColor: "green",
      features: [
        "Stock Management",
        "Supplier Tracking",
        "Category Management",
      ],
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
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CMHO</h1>
              <p className="text-xs text-gray-500">Management Suite</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-white/70 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Main content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pb-24">
          {/* Title section */}
          <div className="text-center mb-12 space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                Welcome Back
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Choose Your Application
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Select the application you want to access
            </p>
          </div>

          {/* App cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {apps.map((app) => {
              const Icon = app.icon;

              return (
                <div
                  key={app.id}
                  className={`group relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 ${
                    app.available
                      ? "cursor-pointer hover:-translate-y-2"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => handleAppSelect(app)}
                  onKeyDown={(e) => {
                    if (app.available && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleAppSelect(app);
                    }
                  }}
                  tabIndex={app.available ? 0 : -1}
                  role="button"
                  aria-label={`Open ${app.name}`}
                  aria-disabled={!app.available}
                >
                  <div className="p-8">
                    {/* Icon and badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`relative w-16 h-16 bg-gradient-to-br ${app.gradient} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                        {app.available && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      {app.available && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </div>
                      )}
                    </div>

                    {/* Title and description */}
                    <div className="mb-6">
                      <h3
                        className={`text-2xl font-bold mb-2 ${
                          app.available ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {app.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    {/* Action button */}
                    {app.available ? (
                      <button
                        className={`w-full bg-gradient-to-r ${app.gradient} text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group-hover:gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppSelect(app);
                        }}
                      >
                        <span>Open Application</span>
                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 font-semibold py-3.5 px-6 rounded-xl text-center flex items-center justify-center gap-2">
                        <span>Coming Soon</span>
                      </div>
                    )}
                  </div>

                  {/* Hover effect overlay */}
                  {app.available && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <button className="text-indigo-600 hover:text-indigo-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
