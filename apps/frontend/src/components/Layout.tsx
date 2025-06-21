import { useState } from "react";
import {
  Users,
  LogOut,
  Building,
  Menu,
  X,
  ArrowRightLeft,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { useLogoutMutation } from "@/store/auth-slice";
import { Button } from "./ui/button";
import ProtectedRoute from "./ProtectedRoute";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { route: "/", label: "Dashboard", icon: LayoutDashboard },
    { route: "/employees", label: "Employees", icon: Users },
    { route: "/payments", label: "Payments", icon: ArrowRightLeft },
  ];

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                    <span className="hidden sm:inline">
                      CMHO Salary Manager
                    </span>
                    <span className="sm:hidden">CMHO Salary</span>
                  </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex ml-8 space-x-4">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.route}
                      to={item.route}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`
                      }
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Desktop Logout */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  className="px-3 py-2 hidden md:flex"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-2">
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.route}
                      to={item.route}
                      className={({ isActive }) =>
                        `w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2 ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`
                      }
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.label}
                    </NavLink>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    isLoading={isLoggingOut}
                    className="px-3 py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
