import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  DollarSign,
  Phone,
  User,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Timer,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  customer_phone: string;
  customer_name?: string;
  items?: any;
  total_amount?: number;
  payment_status?: string;
  status?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  fulfilled: number;
  cancelled: number;
  revenue: number;
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "fulfilled", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  fulfilled: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  confirmed: <CheckCircle className="h-3.5 w-3.5" />,
  processing: <Package className="h-3.5 w-3.5" />,
  fulfilled: <Truck className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
};

// ─── Prep Timer ────────────────────────────────────────────────────────────────

const PREP_MINUTES = 15;

function PrepTimer({ createdAt, orderStatus }: { createdAt: string; orderStatus?: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only show timer for confirmed or processing orders
    if (orderStatus !== "confirmed" && orderStatus !== "processing") {
      setSecondsLeft(null);
      return;
    }

    const endTime = new Date(createdAt).getTime() + PREP_MINUTES * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [createdAt, orderStatus]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 120; // last 2 minutes
  const isDone = secondsLeft === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded ${
        isDone
          ? "bg-green-100 text-green-700"
          : isUrgent
          ? "bg-red-100 text-red-700 animate-pulse"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      <Timer className="h-3 w-3" />
      {isDone ? "Ready!" : `${mins}:${String(secs).padStart(2, "0")}`}
    </span>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border border-border hover:shadow-md transition-all duration-200">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailDialog({
  order,
  open,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  if (!order) return null;

  const items = (() => {
    try {
      if (Array.isArray(order.items)) return order.items;
      if (typeof order.items === "string") return JSON.parse(order.items);
      if (order.items && typeof order.items === "object") return [order.items];
    } catch {}
    return [];
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Order #{order.id.slice(-8).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Placed on {new Date(order.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Customer
            </h4>
            <p className="text-sm text-foreground font-medium">{order.customer_name || "—"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
            </p>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Items
              </h4>
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name || item.product || `Item ${idx + 1}`}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {item.quantity ? `×${item.quantity}` : ""}{" "}
                        {item.price ? `$${Number(item.price).toFixed(2)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {order.total_amount != null && (
                <div className="flex justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-sm font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Notes
              </p>
              <p className="text-sm text-foreground">{order.notes}</p>
            </div>
          )}

          {/* Status update */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={order.status === s ? "default" : "outline"}
                  className="capitalize text-xs"
                  onClick={() => {
                    onStatusChange(order.id, s);
                    onClose();
                  }}
                >
                  {statusIcons[s]}
                  <span className="ml-1">{s}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<"created_at" | "total_amount">("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    fulfilled: 0,
    cancelled: 0,
    revenue: 0,
  });

  // ── Load orders ──────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("retailer_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows: Order[] = (data as Order[]) || [];
      setOrders(rows);

      // Compute stats
      const newStats: OrderStats = {
        total: rows.length,
        pending: rows.filter((o) => o.status === "pending").length,
        confirmed: rows.filter((o) => o.status === "confirmed").length,
        fulfilled: rows.filter((o) => o.status === "fulfilled").length,
        cancelled: rows.filter((o) => o.status === "cancelled").length,
        revenue: rows
          .filter((o) => o.payment_status === "paid" && o.total_amount)
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
      };
      setStats(newStats);
    } catch (err) {
      console.error("loadOrders error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Realtime subscription for new/updated orders
    const channel = supabase
      .channel("retailer_orders_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "retailer_orders" },
        (payload) => {
          const newOrder = payload.new as Order;
          toast.success(
            `New order from ${newOrder.customer_name || newOrder.customer_phone}!`,
            {
              description: `Total: $${Number(newOrder.total_amount || 0).toFixed(2)} — Ready in ~15-20 min`,
              duration: 8000,
            }
          );
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "retailer_orders" },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  // ── Filter + sort ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...orders];

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_phone?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortField === "total_amount") {
        const diff = (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
        return sortDir === "asc" ? diff : -diff;
      }
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? diff : -diff;
    });

    setFiltered(result);
  }, [orders, statusFilter, searchQuery, sortField, sortDir]);

  // ── Status update ─────────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("retailer_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order status updated to "${newStatus}"`);
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  // ── Sort toggle ───────────────────────────────────────────────────────────────
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === "desc" ? (
        <ChevronDown className="h-3.5 w-3.5 ml-1 inline" />
      ) : (
        <ChevronUp className="h-3.5 w-3.5 ml-1 inline" />
      )
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Order Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All orders captured by your AI voice agent — real-time updates
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<ShoppingCart className="h-4 w-4 text-blue-600" />}
          label="Total Orders"
          value={stats.total}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
          label="Pending"
          value={stats.pending}
          color="bg-yellow-50"
          subtitle="Awaiting action"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
          label="Confirmed"
          value={stats.confirmed}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Truck className="h-4 w-4 text-green-600" />}
          label="Fulfilled"
          value={stats.fulfilled}
          color="bg-green-50"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          label="Cancelled"
          value={stats.cancelled}
          color="bg-red-50"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          label="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          color="bg-emerald-50"
          subtitle="Paid orders"
        />
      </div>

      {/* Filters */}
      <Card className="border border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or order ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground ml-auto">
              Showing {filtered.length} of {orders.length} orders
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border border-border">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-primary" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">No orders found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Orders placed via your AI voice agent will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">
                      Customer
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:text-primary"
                      onClick={() => toggleSort("total_amount")}
                    >
                      Amount <SortIcon field="total_amount" />
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">
                      Payment
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">
                      Order Status
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:text-primary"
                      onClick={() => toggleSort("created_at")}
                    >
                      Date <SortIcon field="created_at" />
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {order.customer_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {order.customer_phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">
                          {order.total_amount != null
                            ? `$${Number(order.total_amount).toFixed(2)}`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize border ${
                            statusColors[order.payment_status || "pending"]
                          }`}
                        >
                          {order.payment_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize border flex items-center gap-1 w-fit ${
                            statusColors[order.status || "pending"]
                          }`}
                        >
                          {statusIcons[order.status || "pending"]}
                          {order.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <PrepTimer createdAt={order.created_at} orderStatus={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
