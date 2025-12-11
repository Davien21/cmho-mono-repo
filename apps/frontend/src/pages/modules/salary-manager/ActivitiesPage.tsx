import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/Pagination";
import { IActivityRecordDto, useGetActivitiesQuery } from "@/store/activity-slice";
import { formatTimeAgo } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

function getActivityColor(type: string): string {
  if (type.includes("add") || type.includes("create")) return "bg-green-500";
  if (type.includes("update")) return "bg-blue-500";
  if (type.includes("remove") || type.includes("delete")) return "bg-gray-500";
  return "bg-gray-400";
}

// Key for localStorage
const ALL_ACTIVITIES_PAGINATION_STORAGE_KEY = "allActivitiesPaginationPrefs";

// Load pagination preferences from localStorage
const loadActivitiesPaginationPrefs = (): { pageSize: number } => {
  try {
    const stored = localStorage.getItem(ALL_ACTIVITIES_PAGINATION_STORAGE_KEY);
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
const saveActivitiesPaginationPrefs = (prefs: { pageSize: number }) => {
  try {
    localStorage.setItem(ALL_ACTIVITIES_PAGINATION_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Failed to save pagination preferences:", error);
  }
};

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const previousSearchRef = useRef<string | undefined>(undefined);
  const isSearchingRef = useRef(false);

  // Pagination state with localStorage persistence
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    () => loadActivitiesPaginationPrefs().pageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // No module filter - fetch all activities
  const { data: activitiesResponse, isLoading, isFetching } = useGetActivitiesQuery({
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

  // Track search changes
  useEffect(() => {
    if (previousSearchRef.current !== debouncedSearch) {
      previousSearchRef.current = debouncedSearch;
      isSearchingRef.current = true;
    }
  }, [debouncedSearch]);

  const activities = useMemo(() => {
    return activitiesResponse?.data?.data || [];
  }, [activitiesResponse]);

  // Pagination metadata
  const totalItems = activitiesResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    saveActivitiesPaginationPrefs({ pageSize: newPageSize });
  };

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

            {/* Pagination controls */}
            {activities.length > 0 && (
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
