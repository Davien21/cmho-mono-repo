import * as React from "react";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Wallet,
  Package,
  History,
  Settings,
  Ruler,
  Tags,
  Truck,
  Image as ImageIcon,
  Shield,
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
import {
  useGetInventoryUnitsQuery,
  useGetInventoryCategoriesQuery,
  useGetSuppliersQuery,
} from "@/store/inventory-slice";
import { useGetGalleryQuery } from "@/store/gallery-slice";

// Centralized navigation configuration with breadcrumb support
export const navigationConfig = {
  apps: [
    {
      name: "Admin Manager",
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
    {
      title: "Admins",
      url: "/salary/admins",
      icon: Shield,
      breadcrumbs: [{ label: "Admins", url: "/salary/admins" }],
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
      title: "Inventory",
      url: "/inventory/items",
      icon: Package,
      breadcrumbs: [
        { label: "Inventory", url: "/inventory" },
        { label: "Items", url: "/inventory/items" },
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
    {
      title: "Settings",
      url: "/inventory/settings",
      icon: Settings,
      breadcrumbs: [
        { label: "Inventory", url: "/inventory" },
        { label: "Settings", url: "/inventory/settings" },
      ],
      submenu: [
        {
          title: "Units",
          url: "/inventory/settings?section=Units",
          icon: Ruler,
        },
        {
          title: "Categories",
          url: "/inventory/settings?section=Categories",
          icon: Tags,
        },
        {
          title: "Suppliers",
          url: "/inventory/settings?section=Suppliers",
          icon: Truck,
        },
        {
          title: "Gallery",
          url: "/inventory/settings?section=Gallery",
          icon: ImageIcon,
        },
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

  // Fetch counts for inventory settings submenu items
  const { data: unitsSummary } = useGetInventoryUnitsQuery(undefined, {
    skip: !isInventoryPath,
  });
  const { data: categoriesSummary } = useGetInventoryCategoriesQuery(undefined, {
    skip: !isInventoryPath,
  });
  const { data: suppliersSummary } = useGetSuppliersQuery(undefined, {
    skip: !isInventoryPath,
  });
  const { data: galleryData } = useGetGalleryQuery(
    { page: 1, limit: 100 },
    { skip: !isInventoryPath }
  );

  const unitsCount = unitsSummary?.data?.length ?? 0;
  const categoriesCount = categoriesSummary?.data?.length ?? 0;
  const suppliersCount = suppliersSummary?.data?.length ?? 0;
  const galleryCount = galleryData?.data?.meta?.total ?? 0;

  const currentApp =
    (isInventoryPath
      ? data.apps.find((app) => app.name === "Inventory Manager")
      : data.apps.find((app) => location.pathname.startsWith(app.path))) ||
    data.apps[0];

  // Determine which nav items to show based on current app
  // Add counts to inventory nav submenu items
  const navItems = isInventoryPath
    ? data.inventoryNav.map((item) => {
        if (item.submenu) {
          return {
            ...item,
            submenu: item.submenu.map((subItem) => {
              let count: number | undefined;
              if (subItem.title === "Units") {
                count = unitsCount;
              } else if (subItem.title === "Categories") {
                count = categoriesCount;
              } else if (subItem.title === "Suppliers") {
                count = suppliersCount;
              } else if (subItem.title === "Gallery") {
                count = galleryCount;
              }
              return { ...subItem, badge: count };
            }),
          };
        }
        return item;
      })
    : data.salaryNav;

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
