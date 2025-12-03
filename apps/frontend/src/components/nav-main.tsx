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
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    submenu?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  // Close sidebar when navigating (especially on mobile)
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    // Auto-open items with active submenu items
    items.forEach((item) => {
      if (item.submenu) {
        const currentUrl = location.pathname + location.search;
        const hasActiveSubmenu = item.submenu.some((subItem) => {
          // Check if current URL matches the submenu item URL
          return currentUrl === subItem.url ||
            (subItem.url.includes("?") && currentUrl.includes(subItem.url.split("?")[1]));
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
          const isSalaryRoot = item.url === "/salary";
          const isInventoryHome = item.url === "/inventory";
          const isStockItem = item.url === "/stock";

          const isActive = isSalaryRoot
            ? location.pathname === "/salary"
            : isStockItem
            ? location.pathname.startsWith("/stock") ||
              location.pathname.startsWith("/inventory/stock")
            : isInventoryHome
            ? location.pathname === "/inventory"
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
                      className="w-full text-base h-12"
                    >
                      {item.icon && <item.icon className="size-5" />}
                      <span className="text-base font-medium">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto transition-transform duration-200 size-4",
                          isOpen && "rotate-90"
                        )}
                      />
                    </SidebarMenuButton>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <SidebarMenuSub>
                      {item.submenu.map((subItem) => {
                        const currentUrl = location.pathname + location.search;
                        const isSubActive = currentUrl === subItem.url ||
                          (subItem.url.includes("?") && currentUrl.includes(subItem.url.split("?")[1]));

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              size="md"
                              className="!h-10 text-sm"
                            >
                              <NavLink to={subItem.url} onClick={handleNavClick}>
                                {subItem.icon && <subItem.icon className="size-4" />}
                                <span className="text-sm font-medium">{subItem.title}</span>
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
                className="text-base h-12"
              >
                <NavLink to={item.url} onClick={handleNavClick}>
                  {item.icon && <item.icon className="size-5" />}
                  <span className="text-base font-medium">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
