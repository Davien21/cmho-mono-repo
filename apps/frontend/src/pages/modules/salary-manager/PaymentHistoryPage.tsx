import { useState, useEffect } from "react";
import { Grid, List, RefreshCw, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import GroupedPaymentsTable from "@/components/tables/GroupedPaymentsTable";
import ListedPaymentsTable from "@/components/tables/ListedPaymentsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import { useActivePayments } from "@/hooks/use-active-payments";
import { IAPIResponse, ITransferResponse } from "@/types";
import { ITransactionsResponse } from "@/store/transactions-slice";
import { cn, pluralize } from "@/lib/utils";
import { PaginationSection } from "@/components/PaginationSection";

type ViewMode = "group" | "list";

const PaymentHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Get view mode from URL, default to "list"
  const viewMode = (searchParams.get("view") as ViewMode) || "list";

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use the new hook to get query data
  const { data, isLoading, isFetching, refetch } = useActivePayments({
    viewMode,
    currentPage,
    searchTerm: debouncedSearchTerm,
  });

  // Reset to first page when view mode or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, debouncedSearchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewModeChange = (value: string) => {
    const newViewMode = value as ViewMode;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", newViewMode);
      return newParams;
    });
  };

  const meta = data?.data?.meta;

  return (
    <Layout>
      <Tabs
        value={viewMode}
        onValueChange={handleViewModeChange}
        className="w-auto"
      >
        <div className="space-y-6">
          {/* Header */}
          <div>
            <p className="text-gray-600">View all salary payment records</p>
          </div>

          {/* Search Bar, Tabs and Refresh Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Search Bar */}
            {viewMode === "list" && (
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Tabs and Refresh Button */}
            <div className="ml-auto flex items-center gap-4 w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="group" className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Group</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>

              <button
                onClick={refetch}
                className="flex ml-auto items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw
                  className={cn("w-4 h-4", isFetching && "animate-spin")}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          <TabsContent value="group">
            <GroupedPaymentsTable
              data={data as IAPIResponse<ITransferResponse> | undefined}
              isLoading={isLoading || isFetching}
              isFetching={isFetching}
              refetch={refetch}
            />
          </TabsContent>
          <TabsContent value="list">
            <ListedPaymentsTable
              data={data as IAPIResponse<ITransactionsResponse> | undefined}
              isLoading={isLoading || isFetching}
              isFetching={isFetching}
              refetch={refetch}
            />
          </TabsContent>
          {meta && meta.total > meta.limit && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-lg shadow-sm border px-6 py-4">
              <div className="text-sm text-gray-700 sm:w-full">
                Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
                {pluralize("result", meta.total)}
              </div>

              <PaginationSection
                currentPage={currentPage}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
                hasNextPage={meta.hasNextPage}
                hasPrevPage={meta.hasPrevPage}
              />
            </div>
          )}
        </div>
      </Tabs>
    </Layout>
  );
};

export default PaymentHistoryPage;
