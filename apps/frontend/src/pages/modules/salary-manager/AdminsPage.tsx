import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { useGetAdminsQuery } from "@/store/admins-slice";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AdminsTable } from "@/components/tables/AdminsTable";
import { useModalContext } from "@/contexts/modal-context";

export default function AdminsPage() {
  const { data: adminsResponse, isLoading } = useGetAdminsQuery({
    sort: "desc",
  });
  const { openModal } = useModalContext();

  const admins = adminsResponse?.data || [];

  const handleAddAdmin = () => {
    openModal("add-admin", {});
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage admin accounts and permissions
            </p>
          </div>
          <Button onClick={handleAddAdmin} className="sm:flex-shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            Add Admin
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            {admins.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <p className="text-gray-500">No admins found</p>
                <Button
                  onClick={handleAddAdmin}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Admin
                </Button>
              </div>
            ) : (
              <AdminsTable admins={admins} />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

const TableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-left sm:text-right">
              <Skeleton className="h-4 w-24 mb-2 sm:mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

