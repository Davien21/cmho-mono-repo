import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Scale, TrendingUp, Activity } from "lucide-react";

export default function StockOptionsPage() {
  const navigate = useNavigate();

  const options = [
    {
      title: "Balance Stock",
      description: "Reconcile and balance inventory stock levels",
      icon: Scale,
      path: "/inventory/stock/balance",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Update Stock",
      description: "Add or reduce stock quantities",
      icon: TrendingUp,
      path: "/inventory/stock/update",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "View Activities",
      description: "View all stock movement history and activities",
      icon: Activity,
      path: "/inventory/stock/activities",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="hidden lg:block text-xl sm:text-2xl font-semibold tracking-tight">
            Stock Management
          </h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            Choose an action to manage your inventory stock
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.path}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => navigate(option.path)}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`${option.bgColor} p-4 rounded-full`}>
                    <Icon className={`h-8 w-8 ${option.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

