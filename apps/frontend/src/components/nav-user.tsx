import { LogOut } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetCurrentUserQuery } from "@/store/auth-slice";
import { BorderedOptions } from "@/components/BorderedOptions";

function getInitials(name: string | undefined): string {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function NavUser({
  onLogout,
  isLoggingOut,
}: {
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  const { state } = useSidebar();
  const { data: userResponse, isLoading } = useGetCurrentUserQuery();
  const user = userResponse?.data;
  const userName = isLoading ? "Loading..." : user?.name || "Admin";
  const userEmail = isLoading ? "..." : user?.email || "admin@cmho.com";
  const initials = getInitials(user?.name);
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 w-full">
          <div className={isCollapsed ? "w-full" : "flex-1 flex items-center gap-2"}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold max-w-[120px]">
                  {userName}
                </span>
                <span className="truncate text-xs text-muted-foreground max-w-[120px]">
                  {userEmail}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <BorderedOptions
              align="end"
              className="h-8 w-8"
              contentClassName="min-w-56 max-w-xs"
              side="top"
              sideOffset={8}
            >
              {/* User profile summary */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm flex-1 break-words">
                  <span className="font-semibold break-words">
                    {userName}
                  </span>
                  <span className="text-xs text-muted-foreground break-words">
                    {userEmail}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </BorderedOptions>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
