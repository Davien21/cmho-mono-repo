// Layout component with sidebar navigation
import * as React from "react";
import { AppSidebar, navigationConfig } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ProtectedRoute from "./ProtectedRoute";
import { useLocation, Link } from "react-router-dom";
import {
  useGetInventoryCategoriesQuery,
  useGetInventoryItemsQuery,
  useGetInventoryUnitsQuery,
} from "@/store/inventory-slice";

type BreadcrumbItem = {
  label: string;
  url: string | null;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Prefetch inventory units & categories globally so they're cached before use
  useGetInventoryUnitsQuery();
  useGetInventoryCategoriesQuery();
  const { data: inventoryItemsResponse } = useGetInventoryItemsQuery();

  // Get breadcrumbs for current route from centralized navigation config
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Special handling for inventory stock overview + filtered-by-item routes
    if (pathname === "/stock" || pathname === "/inventory/stock") {
      const itemId = searchParams.get("itemId") || "";

      let itemLabel: string | null = null;
      if (itemId && inventoryItemsResponse?.data) {
        const match = inventoryItemsResponse.data.find(
          (item) => item._id === itemId
        );
        if (match) {
          itemLabel = match.name;
        }
      }

      const baseCrumbs: BreadcrumbItem[] = [
        { label: "Inventory", url: "/inventory" },
        { label: "Stock Changes", url: "/stock" },
      ];

      if (itemLabel) {
        baseCrumbs.push({ label: itemLabel, url: null });
      }

      return baseCrumbs;
    }

    // Check all navigation items from both nav groups
    const allNavItems = [
      ...navigationConfig.salaryNav,
      ...navigationConfig.inventoryNav,
    ];

    // Find exact match first
    const matchedNav = allNavItems.find((item) => item.url === pathname);
    if (matchedNav?.breadcrumbs) {
      return matchedNav.breadcrumbs;
    }

    // Check additional routes with patterns (for dynamic routes)
    const matchedRoute = navigationConfig.additionalRoutes.find((route) =>
      route.pattern.test(pathname)
    );
    if (matchedRoute?.breadcrumbs) {
      return matchedRoute.breadcrumbs;
    }

    // Default fallback
    return [{ label: "CMHO", url: null }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 || !crumb.url ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.url}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
