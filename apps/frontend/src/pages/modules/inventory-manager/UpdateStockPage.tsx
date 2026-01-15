import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function UpdateStockPage() {
  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Update Stock
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            Add or reduce stock quantities
          </p>
        </div>

        <Card className="p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="bg-green-50 p-6 rounded-full">
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              Update Stock Feature
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              This feature will allow you to quickly add new stock or reduce
              existing stock quantities. You'll be able to update multiple items
              and track the changes in the activities log.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

