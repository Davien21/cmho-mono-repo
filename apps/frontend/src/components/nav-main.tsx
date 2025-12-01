import { type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const location = useLocation();

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

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
              >
                <NavLink to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
