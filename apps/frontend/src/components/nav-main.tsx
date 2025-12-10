import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number;
}

interface Item {
  title: string;
  url: string;
  icon?: LucideIcon;
  submenu?: SubItem[];
}

export function NavMain({ items }: { items: Item[] }) {
  const location = useLocation();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const isCollapsed = state === "collapsed";

  // Close sidebar when navigating (especially on mobile)
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  React.useEffect(() => {
    // Auto-open items with active submenu items
    items.forEach((item) => {
      if (item.submenu) {
        const currentUrl = location.pathname + location.search;
        const hasActiveSubmenu = item.submenu.some((subItem) => {
          // Check if current URL matches the submenu item URL
          return (
            currentUrl === subItem.url ||
            (subItem.url.includes("?") &&
              currentUrl.includes(subItem.url.split("?")[1]))
          );
        });
        if (hasActiveSubmenu && !openItems.includes(item.title)) {
          setOpenItems((prev) => [...prev, item.title]);
        }
      }
    });
  }, [location.pathname, location.search, items, openItems]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isSalaryRoot = item.url === "/admin";
          const isInventoryHome = item.url === "/inventory";
          const isInventoryItems = item.url === "/inventory/items";
          const isStockItem = item.url === "/stock";

          const isActive = isSalaryRoot
            ? location.pathname === "/admin"
            : isStockItem
            ? location.pathname.startsWith("/stock") ||
              location.pathname.startsWith("/inventory/stock-movement")
            : isInventoryHome
            ? location.pathname === "/inventory"
            : isInventoryItems
            ? location.pathname.startsWith("/inventory/items")
            : location.pathname.startsWith(item.url);

          const isOpen = openItems.includes(item.title);
          const hasSubmenu = item.submenu && item.submenu.length > 0;

          if (hasSubmenu) {
            return (
              <Collapsible.Root
                key={item.title}
                open={isOpen}
                onOpenChange={(open) => {
                  setOpenItems((prev) =>
                    open
                      ? [...prev, item.title]
                      : prev.filter((title) => title !== item.title)
                  );
                }}
              >
                <SidebarMenuItem>
                  <Collapsible.Trigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      size="lg"
                      className="w-full text-base h-12 group-data-[collapsible=icon]:justify-center"
                    >
                      {item.icon && <item.icon className="size-5" />}
                      {!isCollapsed && (
                        <>
                          <span className="text-base font-medium">
                            {item.title}
                          </span>
                          <ChevronRight
                            className={cn(
                              "ml-auto transition-transform duration-200 size-4",
                              isOpen && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </SidebarMenuButton>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <SidebarMenuSub>
                      {item.submenu?.map?.((subItem) => {
                        const currentUrl = location.pathname + location.search;
                        const isSubActive =
                          currentUrl === subItem.url ||
                          (subItem.url.includes("?") &&
                            currentUrl.includes(subItem.url.split("?")[1]));

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              size="md"
                              className="!h-11 sm:!h-10 text-base sm:text-sm group-data-[collapsible=icon]:justify-center"
                            >
                              <NavLink
                                to={subItem.url}
                                onClick={handleNavClick}
                                className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                              >
                                {subItem.icon && (
                                  <subItem.icon className="size-5 sm:size-4" />
                                )}
                                {!isCollapsed && (
                                  <>
                                    <span className="text-base sm:text-sm font-medium">
                                      {subItem.title}
                                    </span>
                                    {subItem.badge !== undefined && (
                                      <Badge className="ml-auto text-xs sm:text-[11px] font-medium px-2 py-0 h-6 sm:h-5 rounded-full bg-slate-100 text-slate-700">
                                        {subItem.badge}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </Collapsible.Content>
                </SidebarMenuItem>
              </Collapsible.Root>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                size="lg"
                className="text-base h-12 group-data-[collapsible=icon]:justify-center"
              >
                <NavLink
                  to={item.url}
                  onClick={handleNavClick}
                  className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                >
                  {item.icon && <item.icon className="size-5" />}
                  {!isCollapsed && (
                    <span className="text-base font-medium">{item.title}</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
