import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useGetInventoryItemsQuery } from "@/store/inventory-slice";
import { useGetActivitiesQuery } from "@/store/activity-slice";
import { useGetNotificationsQuery } from "@/store/notifications-slice";
import { formatTimeAgo } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { InventoryItem } from "@/types/inventory";
import { IInventoryItemDto } from "@/store/inventory-slice";

interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface ActivityItem {
  id: string;
  description: string;
  performerName: string;
  timeAgo: string;
  type: "add" | "update" | "remove" | "create" | "other";
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  priority: "HIGH" | "MED" | "LOW";
  timeAgo: string;
  type: "out_of_stock" | "low_stock" | "system";
}

function calculateStats(items: InventoryItem[]): InventoryStats {
  const totalItems = items.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  items.forEach((item) => {
    const currentStock = item.currentStockInBaseUnits || 0;

    if (currentStock === 0) {
      outOfStock++;
    } else if (item.lowStockValue && currentStock <= item.lowStockValue) {
      lowStock++;
    } else {
      inStock++;
    }
  });

  return { totalItems, inStock, lowStock, outOfStock };
}

function getActivityType(type: string): ActivityItem["type"] {
  if (type.includes("add") || type.includes("create")) return "add";
  if (type.includes("update")) return "update";
  if (type.includes("remove") || type.includes("delete")) return "remove";
  if (type.includes("create")) return "create";
  return "other";
}

function getActivityColor(type: ActivityItem["type"]): string {
  switch (type) {
    case "add":
    case "create":
      return "bg-green-500";
    case "update":
      return "bg-blue-500";
    case "remove":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
}

export function InventoryDashboard() {
  const navigate = useNavigate();
  const { data: inventoryData, isLoading: isLoadingInventory } =
    useGetInventoryItemsQuery();
  const { data: activitiesData, isLoading: isLoadingActivities } =
    useGetActivitiesQuery(
      {
        module: "inventory",
        limit: 5,
        sort: "desc",
      },
      {
        pollingInterval: 3000,
      }
    );
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useGetNotificationsQuery(
      {
        status: "active",
        module: "inventory",
        limit: 5,
        sort: "desc",
      },
      {
        pollingInterval: 3000,
      }
    );

  const items: InventoryItem[] = useMemo(() => {
    const dtos: IInventoryItemDto[] = inventoryData?.data?.data || [];
    return dtos.map((dto) => ({
      id: dto._id,
      name: dto.name,
      description: "",
      category: dto.category,
      units: (dto.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        plural: u.plural,
        quantity: u.quantity,
      })),
      lowStockValue: dto.lowStockValue,
      currentStockInBaseUnits: dto.currentStockInBaseUnits,
      earliestExpiryDate: dto.earliestExpiryDate ?? null,
      image: dto.image,
    }));
  }, [inventoryData]);

  const stats = useMemo(() => calculateStats(items), [items]);

  const activities: ActivityItem[] = useMemo(() => {
    if (!activitiesData?.data?.data) return [];
    return activitiesData.data.data.map((activity) => ({
      id: activity._id,
      description: activity.description,
      performerName: activity.performer?.name || "Unknown",
      timeAgo: formatTimeAgo(activity.createdAt),
      type: getActivityType(activity.type),
    }));
  }, [activitiesData]);

  const notifications: NotificationItem[] = useMemo(() => {
    if (!notificationsData?.data?.data) return [];

    return notificationsData.data.data.map((notification) => ({
      id: notification._id,
      title: notification.title,
      description: notification.description,
      priority: notification.priority,
      timeAgo: formatTimeAgo(notification.updatedAt),
      type: notification.type,
    }));
  }, [notificationsData]);

  if (isLoadingInventory) {
    return <InventoryDashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-base sm:text-sm text-muted-foreground">
          Monitor your inventory status and recent activity
        </p>
      </div>

      {/* Stats Cards */}
      {/* Mobile: Horizontal scroll */}
      <div className="sm:hidden -mx-4 w-[calc(100vw)] overflow-x-auto pb-2 scrollbar-hide pl-4">
        <div className="flex gap-4 pr-4 w-max">
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={stats.outOfStock.toLocaleString()}
            color="bg-red-500"
            onClick={() => navigate("/inventory/items?filter=outOfStock")}
          />
          <StatCard
            icon={Clock}
            label="Low Stock"
            value={stats.lowStock.toLocaleString()}
            color="bg-orange-500"
            onClick={() => navigate("/inventory/items?filter=lowStock")}
          />
          <StatCard
            icon={CheckCircle2}
            label="In Stock"
            value={stats.inStock.toLocaleString()}
            color="bg-green-500"
            onClick={() => navigate("/inventory/items?filter=inStock")}
          />
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems.toLocaleString()}
            color="bg-blue-500"
            onClick={() => navigate("/inventory/items")}
          />
        </div>
      </div>
      {/* Desktop: Grid layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          label="Out of Stock"
          value={stats.outOfStock.toLocaleString()}
          color="bg-red-500"
          onClick={() => navigate("/inventory/items?filter=outOfStock")}
        />
        <StatCard
          icon={Clock}
          label="Low Stock"
          value={stats.lowStock.toLocaleString()}
          color="bg-orange-500"
          onClick={() => navigate("/inventory/items?filter=lowStock")}
        />
        <StatCard
          icon={CheckCircle2}
          label="In Stock"
          value={stats.inStock.toLocaleString()}
          color="bg-green-500"
          onClick={() => navigate("/inventory/items?filter=inStock")}
        />
        <StatCard
          icon={Package}
          label="Total Items"
          value={stats.totalItems.toLocaleString()}
          color="bg-blue-500"
          onClick={() => navigate("/inventory/items")}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600"
              onClick={() => navigate("/inventory/activities")}
            >
              View All
            </Button>
          </div>
          {isLoadingActivities ? (
            <ActivitySkeleton />
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(
                      activity.type
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.performerName} • {activity.timeAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <div className="bg-blue-600 text-white text-sm font-bold rounded px-2.5 py-1">
                  {notifications.filter((_, i) => i < 3).length}
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
            </div>
            {notifications.length > 0 && (
              <button
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate("/inventory/notifications")}
              >
                View All
              </button>
            )}
          </div>
          {isLoadingNotifications ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications
            </p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.type === "out_of_stock"
                            ? "bg-red-500"
                            : notification.type === "low_stock"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </span>
                          {notification.priority && (
                            <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                              {notification.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.timeAgo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length > 3 && (
                <>
                  <div className="border-t border-gray-200 my-3"></div>
                  <button
                    className="w-full text-sm text-blue-600 hover:bg-gray-50 font-medium py-3 rounded-md transition-all"
                    onClick={() => navigate("/inventory/notifications")}
                  >
                    Show All ({notifications.length})
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, color, onClick }: StatCardProps) {
  const isDesktop = useMediaQuery("desktop");

  const cardContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center flex-1 min-w-0">
        <div className={`${color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1 overflow-hidden">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
      {onClick && !isDesktop && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="ml-2 flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={`View ${label}`}
        >
          <ExternalLink className="w-6 h-6 lg:w-5 lg:h-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
      {onClick && isDesktop && (
        <div className="ml-2 flex-shrink-0">
          <ExternalLink className="w-6 h-6 lg:w-5 lg:h-5 text-gray-400" />
        </div>
      )}
    </div>
  );

  if (onClick && isDesktop) {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border flex-shrink-0 w-[280px] max-w-[280px] sm:w-auto sm:max-w-none cursor-pointer hover:shadow-md transition-shadow"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border flex-shrink-0 w-[280px] max-w-[280px] sm:w-auto sm:max-w-none">
      {cardContent}
    </div>
  );
}

function InventoryDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-2 h-2 rounded-full mt-2" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
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
    </div>
  );
}
