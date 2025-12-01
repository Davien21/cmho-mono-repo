import * as React from "react";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Wallet,
  Package,
  History,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { AppSwitcher } from "@/components/app-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLogoutMutation } from "@/store/auth-slice";

// Centralized navigation configuration with breadcrumb support
export const navigationConfig = {
  apps: [
    {
      name: "Salary Manager",
      path: "/salary",
      icon: Wallet,
    },
    {
      name: "Inventory Manager",
      path: "/inventory",
      icon: Package,
    },
  ],
  salaryNav: [
    {
      title: "Salaries",
      url: "/salary",
      icon: LayoutDashboard,
      breadcrumbs: [{ label: "Salaries", url: "/salary" }],
    },
    {
      title: "Employees",
      url: "/salary/employees",
      icon: Users,
      breadcrumbs: [{ label: "Employees", url: "/salary/employees" }],
    },
    {
      title: "Payments",
      url: "/salary/payments",
      icon: ArrowRightLeft,
      breadcrumbs: [{ label: "Payment History", url: "/salary/payments" }],
    },
  ],
  inventoryNav: [
    {
      title: "Home",
      url: "/inventory",
      icon: Package,
      breadcrumbs: [{ label: "Inventory", url: "/inventory" }],
    },
    {
      title: "Settings",
      url: "/inventory/settings",
      icon: Settings,
      breadcrumbs: [
        { label: "Inventory", url: "/inventory" },
        { label: "Settings", url: "/inventory/settings" },
      ],
    },
    {
      title: "Stock",
      url: "/stock",
      icon: History,
      breadcrumbs: [
        { label: "Inventory", url: "/inventory" },
        { label: "Stock", url: "/stock" },
      ],
    },
  ],
  // Additional routes not in sidebar navigation
  additionalRoutes: [
    {
      pattern: /^\/salary\/payments\/[^/]+$/,
      breadcrumbs: [
        { label: "Payment History", url: "/salary/payments" },
        { label: "Transfer Details", url: null }, // null means current page, not clickable
      ],
    },
  ],
};

// Keep data for internal use
const data = navigationConfig;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const isInventoryPath =
    location.pathname.startsWith("/inventory") ||
    location.pathname.startsWith("/stock");

  const currentApp =
    (isInventoryPath
      ? data.apps.find((app) => app.name === "Inventory Manager")
      : data.apps.find((app) => location.pathname.startsWith(app.path))) ||
    data.apps[0];

  // Determine which nav items to show based on current app
  const navItems = isInventoryPath ? data.inventoryNav : data.salaryNav;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSwitcher apps={data.apps} currentApp={currentApp} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
