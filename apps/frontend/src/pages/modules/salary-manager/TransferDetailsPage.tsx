import { useParams } from "react-router-dom";
import { User, DollarSign, Calendar, Hash } from "lucide-react";
import { useGetTransferDetailsQuery } from "@/store/transfers-slice";
import { formatDate, formatKobo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import PaymentsTable, {
  PaymentsTableSkeleton,
} from "@/components/tables/PaymentsTable";

const TransferDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: transferDetailsResponse,
    isLoading: isLoadingTransfer,
    error: transferError,
  } = useGetTransferDetailsQuery(id!);

  const transferDetails = transferDetailsResponse?.data;

  if (isLoadingTransfer) {
    return <TransferDetailsSkeleton />;
  }

  if (transferError || !transferDetails) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-red-400 mb-4">
              <Hash className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Transfer Not Found
            </h3>
            <p className="text-gray-600">
              The transfer you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Transfer Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment Details
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatKobo(transferDetails.amountInKobo)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Employees Paid</p>
                <p className="text-xl font-bold text-gray-900">
                  {transferDetails.transactions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Date Created</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatDate(transferDetails.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Breakdown
            </h2>
            <p className="text-gray-600">
              Individual salary payments within this transfer
            </p>
          </div>

          <PaymentsTable transactions={transferDetails.transactions} />
        </div>
      </div>
    </Layout>
  );
};

const TransferDetailsSkeleton = () => (
  <Layout>
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <PaymentsTableSkeleton />
      </div>
    </div>
  </Layout>
);

export default TransferDetailsPage;
