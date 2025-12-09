import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IActivityRecordDto } from "@/store/activity-slice";
import { formatTimeAgo } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteActivities } from "@/hooks/use-infinite-activities";

function getActivityColor(type: string): string {
  if (type.includes("add") || type.includes("create")) return "bg-green-500";
  if (type.includes("update")) return "bg-blue-500";
  if (type.includes("remove") || type.includes("delete")) return "bg-gray-500";
  return "bg-gray-400";
}

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const isSearchingRef = useRef(false);

  // No module filter - fetch all activities
  const { activities, isLoading, isFetching, isFetchingNextPage, hasNextPage } =
    useInfiniteActivities({
      loadMoreRef,
      search: debouncedSearch || undefined,
      sort: "desc",
    });

  // Reset search flag when fetch completes
  useEffect(() => {
    if (!isFetching && isSearchingRef.current) {
      isSearchingRef.current = false;
    }
  }, [isFetching]);

  // Track search changes
  useEffect(() => {
    if (previousSearchRef.current !== debouncedSearch) {
      previousSearchRef.current = debouncedSearch;
      isSearchingRef.current = true;
    }
  }, [debouncedSearch]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Activities
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            View all activities and track changes
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search by description or performer name..."
            className="pl-8 pr-8"
          />
          {(isLoading || (isFetching && isSearchingRef.current)) && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
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
                : "Activities will appear here as changes are made"}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {activities.map((activity: IActivityRecordDto) => (
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
                          by {activity.performer?.name || "Unknown"}
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
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  Loading more activities...
                </div>
              </div>
            )}

            {/* Intersection observer target - only show when there's more to load */}
            {hasNextPage && <div ref={loadMoreRef} className="h-20" />}

            {/* End of list indicator - only show when we're done and not fetching */}
            {!hasNextPage && activities.length > 0 && !isFetching && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more activities to load
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
