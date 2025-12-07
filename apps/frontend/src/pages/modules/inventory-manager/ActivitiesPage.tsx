import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetActivitiesQuery } from "@/store/activity-slice";
import { formatTimeAgo } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { IActivityRecordDto } from "@/store/activity-slice";

function getActivityColor(type: string): string {
  if (type.includes("add") || type.includes("create")) return "bg-green-500";
  if (type.includes("update")) return "bg-blue-500";
  if (type.includes("remove") || type.includes("delete")) return "bg-gray-500";
  return "bg-gray-400";
}

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [allActivities, setAllActivities] = useState<IActivityRecordDto[]>([]);
  const debouncedSearch = useDebounce(search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useGetActivitiesQuery({
    module: "inventory",
    search: debouncedSearch || undefined,
    limit: 20,
    page,
    sort: "desc",
  });

  const currentPageActivities = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const limit = data?.data?.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;

  // Reset page when search changes, but don't clear data yet
  useEffect(() => {
    if (previousSearchRef.current !== debouncedSearch) {
      previousSearchRef.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // Accumulate activities as pages load
  useEffect(() => {
    if (currentPageActivities.length > 0) {
      if (page === 1) {
        // First page - replace all (this happens when new data arrives after search change)
        setAllActivities(currentPageActivities);
      } else {
        // Subsequent pages - append
        setAllActivities((prev) => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prev.map((a) => a._id));
          const newActivities = currentPageActivities.filter(
            (a) => !existingIds.has(a._id)
          );
          return [...prev, ...newActivities];
        });
      }
    } else if (currentPageActivities.length === 0 && page === 1 && !isFetching) {
      // Only clear if we got empty results and we're not fetching
      setAllActivities([]);
    }
  }, [currentPageActivities, page, isFetching]);

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

  const activities = allActivities;

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Activities
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            View all inventory activities and track changes
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page when searching
            }}
            placeholder="Search by description or admin name..."
            className="pl-8 pr-8"
          />
          {(isLoading || isFetching) && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {isLoading && page === 1 ? (
          <Card className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ) : activities.length === 0 && !isFetching ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              No activities found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try adjusting your search terms"
                : "Activities will appear here as inventory changes are made"}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card
                  key={activity._id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getActivityColor(
                        activity.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">
                          by {activity.admin.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
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
                  Loading more activities...
                </div>
              </div>
            )}

            {/* End of list indicator */}
            {!hasNextPage && activities.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more activities to load
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

