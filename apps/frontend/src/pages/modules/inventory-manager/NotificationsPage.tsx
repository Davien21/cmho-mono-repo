import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteNotifications } from "@/hooks/use-infinite-notifications";
import { NotificationType } from "../../../../../backend/src/modules/notifications/trigger_notifications.types";

function getNotificationColor(type: string): string {
  if (type === "out_of_stock") return "bg-red-500";
  if (type === "low_stock") return "bg-amber-500";
  return "bg-blue-500";
}

function getPriorityColor(priority: string): string {
  if (priority === "HIGH") return "bg-red-100 text-red-800";
  if (priority === "MED") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

// Notification type options for filtering
const notificationTypeOptions = [
  { value: NotificationType.OUT_OF_STOCK, label: "Out of Stock" },
  { value: NotificationType.LOW_STOCK, label: "Low Stock" },
];

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const previousTypeFilterRef = useRef<string>("all");

  const {
    notifications,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteNotifications({
    loadMoreRef,
    module: "inventory",
    type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
    search: debouncedSearch || undefined,
    sort: "desc",
  });

  // Track search/filter changes
  useEffect(() => {
    if (
      previousSearchRef.current !== debouncedSearch ||
      previousTypeFilterRef.current !== typeFilter
    ) {
      previousSearchRef.current = debouncedSearch;
      previousTypeFilterRef.current = typeFilter;
    }
  }, [debouncedSearch, typeFilter]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            View and manage inventory notifications
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by description..."
              className="pl-8 pr-8"
            />
            {(isLoading || isFetching) && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {notificationTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ) : notifications.length === 0 && !isFetching ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              No notifications found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {debouncedSearch || (typeFilter && typeFilter !== "all")
                ? "Try adjusting your search or filter terms"
                : "Notifications will appear here when inventory issues are detected"}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotificationColor(
                        notification.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </span>
                        {notification.priority && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {notification.type}
                        </span>
                        {notification.status && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              notification.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notification.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(notification.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Loading indicator at bottom for infinite scroll */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  Loading more notifications...
                </div>
              </div>
            )}

            {/* Intersection observer target - only show when there's more to load */}
            {hasNextPage && <div ref={loadMoreRef} className="h-20" />}

            {/* End of list indicator */}
            {!hasNextPage && notifications.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more notifications to load
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
