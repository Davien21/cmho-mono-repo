import {
  LogOut,
  User2,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useGetCurrentUserQuery } from "@/store/auth-slice"

export function NavUser({
  onLogout,
  isLoggingOut,
}: {
  onLogout: () => void
  isLoggingOut: boolean
}) {
  const { data: userResponse, isLoading } = useGetCurrentUserQuery();
  const user = userResponse?.data;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
            <User2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {isLoading ? "Loading..." : user?.name || "Admin"}
            </span>
            <span className="truncate text-xs">
              {isLoading ? "..." : user?.email || "admin@cmho.com"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onLogout}
          disabled={isLoggingOut}
          tooltip="Logout"
        >
          <LogOut />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

