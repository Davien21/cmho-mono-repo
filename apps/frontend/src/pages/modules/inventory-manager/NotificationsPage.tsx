import { useState, useEffect, useRef, useMemo } from "react";
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
import { Pagination } from "@/components/Pagination";
import { useGetNotificationsQuery } from "@/store/notifications-slice";
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

// Key for localStorage
const NOTIFICATIONS_PAGINATION_STORAGE_KEY = "notificationsPaginationPrefs";

// Load pagination preferences from localStorage
const loadNotificationsPaginationPrefs = (): { pageSize: number } => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_PAGINATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { pageSize: parsed.pageSize || 10 };
    }
  } catch (error) {
    console.error("Failed to load pagination preferences:", error);
  }
  return { pageSize: 10 };
};

// Save pagination preferences to localStorage
const saveNotificationsPaginationPrefs = (prefs: { pageSize: number }) => {
  try {
    localStorage.setItem(
      NOTIFICATIONS_PAGINATION_STORAGE_KEY,
      JSON.stringify(prefs)
    );
  } catch (error) {
    console.error("Failed to save pagination preferences:", error);
  }
};

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const previousTypeFilterRef = useRef<string>("all");
  const isSearchingRef = useRef(false);

  // Pagination state with localStorage persistence
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    () => loadNotificationsPaginationPrefs().pageSize
  );

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, debouncedSearch]);

  const {
    data: notificationsResponse,
    isLoading,
    isFetching,
  } = useGetNotificationsQuery({
    module: "inventory",
    type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
    search: debouncedSearch || undefined,
    sort: "desc",
    page: currentPage,
    limit: pageSize,
  });

  // Reset search flag when fetch completes
  useEffect(() => {
    if (!isFetching && isSearchingRef.current) {
      isSearchingRef.current = false;
    }
  }, [isFetching]);

  // Track search/filter changes
  useEffect(() => {
    if (
      previousSearchRef.current !== debouncedSearch ||
      previousTypeFilterRef.current !== typeFilter
    ) {
      previousSearchRef.current = debouncedSearch;
      previousTypeFilterRef.current = typeFilter;
      isSearchingRef.current = true;
    }
  }, [debouncedSearch, typeFilter]);

  const notifications = useMemo(() => {
    return notificationsResponse?.data?.data || [];
  }, [notificationsResponse]);

  // Pagination metadata
  const totalItems = notificationsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    saveNotificationsPaginationPrefs({ pageSize: newPageSize });
  };

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
            {(isLoading || (isFetching && isSearchingRef.current)) && (
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

            {/* Pagination controls */}
            {notifications.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isFetching}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
