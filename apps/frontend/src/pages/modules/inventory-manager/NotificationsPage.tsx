import { useState, useMemo, useEffect, useRef } from "react";
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
import { useGetNotificationsQuery } from "@/store/notifications-slice";
import { formatTimeAgo } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { INotificationDto } from "@/store/notifications-slice";

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

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [titleFilter, setTitleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [allNotifications, setAllNotifications] = useState<INotificationDto[]>([]);
  const debouncedSearch = useDebounce(search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const previousTitleFilterRef = useRef<string>("all");

  // Get unique titles from notifications for the filter
  const { data: allNotificationsData } = useGetNotificationsQuery({
    module: "inventory",
    limit: 1000, // Get all to extract unique titles
  });

  const uniqueTitles = useMemo(() => {
    const titles = new Set<string>();
    allNotificationsData?.data?.data?.forEach((notif) => {
      if (notif.title) titles.add(notif.title);
    });
    return Array.from(titles).sort();
  }, [allNotificationsData]);

  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    module: "inventory",
    title: titleFilter && titleFilter !== "all" ? titleFilter : undefined,
    search: debouncedSearch || undefined,
    limit: 20,
    page,
    sort: "desc",
  });

  const currentPageNotifications = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const limit = data?.data?.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;

  // Reset page when search or filter changes, but don't clear data yet
  useEffect(() => {
    if (
      previousSearchRef.current !== debouncedSearch ||
      previousTitleFilterRef.current !== titleFilter
    ) {
      previousSearchRef.current = debouncedSearch;
      previousTitleFilterRef.current = titleFilter;
      setPage(1);
    }
  }, [debouncedSearch, titleFilter]);

  // Accumulate notifications as pages load
  useEffect(() => {
    if (currentPageNotifications.length > 0) {
      if (page === 1) {
        // First page - replace all (this happens when new data arrives after search/filter change)
        setAllNotifications(currentPageNotifications);
      } else {
        // Subsequent pages - append
        setAllNotifications((prev) => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prev.map((n) => n._id));
          const newNotifications = currentPageNotifications.filter(
            (n) => !existingIds.has(n._id)
          );
          return [...prev, ...newNotifications];
        });
      }
    } else if (currentPageNotifications.length === 0 && page === 1 && !isFetching) {
      // Only clear if we got empty results and we're not fetching
      setAllNotifications([]);
    }
  }, [currentPageNotifications, page, isFetching]);

  // Infinite scroll handler
  useEffect(() => {
    if (!hasNextPage || isFetching || isLoading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      // Load more when user is within 300px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 300) {
        setPage((prev) => {
          if (prev >= totalPages) return prev;
          return prev + 1;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetching, isLoading, totalPages]);

  const notifications = allNotifications;

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
            value={titleFilter}
            onValueChange={(value) => {
              setTitleFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Titles</SelectItem>
              {uniqueTitles.map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && page === 1 ? (
          <Card className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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
              {debouncedSearch || (titleFilter && titleFilter !== "all")
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
            {isFetching && page > 1 && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  Loading more notifications...
                </div>
              </div>
            )}

            {/* End of list indicator */}
            {!hasNextPage && notifications.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more notifications to load
              </div>
            )}

            {/* Intersection observer target */}
            <div ref={loadMoreRef} className="h-1" />
          </>
        )}
      </div>
    </Layout>
  );
}

