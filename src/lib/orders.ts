import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { retailCrmGet, type RetailCrmOrder } from "@/lib/retailcrm";

export type OrdersRow = {
  id: number;
  number: string | null;
  external_id: string | null;
  created_at: string | null;
  status: string | null;
  total_sum: number;
  city: string | null;
  utm_source: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  items: Array<{ productName: string; quantity: number; initialPrice: number }>;
  raw: RetailCrmOrder;
};

function computeOrderTotal(order: RetailCrmOrder) {
  if (typeof order.totalSumm === "number") {
    return order.totalSumm;
  }

  return (order.items ?? []).reduce((sum, item) => {
    const price = item.initialPrice ?? item.prices?.[0]?.price ?? 0;
    const quantity = item.quantity ?? 1;
    return sum + price * quantity;
  }, 0);
}

export function mapRetailOrder(order: RetailCrmOrder): OrdersRow {
  return {
    id: order.id,
    number: order.number ?? null,
    external_id: order.externalId ?? null,
    created_at: order.createdAt ?? null,
    status: order.status ?? null,
    total_sum: computeOrderTotal(order),
    city: order.delivery?.address?.city ?? null,
    utm_source: order.customFields?.utm_source ?? null,
    customer_name: [order.firstName, order.lastName].filter(Boolean).join(" ") || null,
    phone: order.phone ?? null,
    email: order.email ?? null,
    items: (order.items ?? []).map((item) => ({
      productName: item.productName ?? "Без названия",
      quantity: item.quantity ?? 1,
      initialPrice: item.initialPrice ?? item.prices?.[0]?.price ?? 0,
    })),
    raw: order,
  };
}

export async function fetchAllRetailOrders() {
  const orders: RetailCrmOrder[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await retailCrmGet<{
      orders: RetailCrmOrder[];
      pagination?: { totalPageCount?: number };
    }>("orders", {
      page: String(page),
      limit: "100",
    });

    orders.push(...(response.orders ?? []));
    totalPages = response.pagination?.totalPageCount ?? page;
    page += 1;
  } while (page <= totalPages);

  return orders;
}

export async function runOrderSync() {
  const supabase = createSupabaseAdmin();
  const retailOrders = await fetchAllRetailOrders();
  const rows = retailOrders.map(mapRetailOrder);

  const { error } = await supabase.from("orders").upsert(rows, { onConflict: "id" });
  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  const { error: stateError } = await supabase.from("sync_state").upsert(
    {
      key: "last_full_sync_at",
      value: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (stateError) {
    throw new Error(`Supabase sync_state update failed: ${stateError.message}`);
  }

  return {
    fetched: retailOrders.length,
    upserted: rows.length,
  };
}

export async function getDashboardData() {
  const supabase = createSupabaseAdmin();

  const [
    { data: recentOrders, error: recentOrdersError },
    { data: aggregateOrders, error: aggregateOrdersError },
    { data: dailySales, error: salesError },
  ] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, created_at, total_sum, city, utm_source, customer_name, status")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("orders")
        .select("id, total_sum, city, utm_source")
        .order("created_at", { ascending: false }),
      supabase.from("daily_sales").select("*").order("day", { ascending: true }),
    ]);

  if (recentOrdersError) {
    throw new Error(`Supabase recent orders query failed: ${recentOrdersError.message}`);
  }

  if (aggregateOrdersError) {
    throw new Error(`Supabase aggregate orders query failed: ${aggregateOrdersError.message}`);
  }

  if (salesError) {
    throw new Error(`Supabase daily_sales query failed: ${salesError.message}`);
  }

  const safeRecentOrders = recentOrders ?? [];
  const safeAggregateOrders = aggregateOrders ?? [];
  const safeSales = dailySales ?? [];

  const totalRevenue = safeAggregateOrders.reduce((sum, order) => sum + Number(order.total_sum ?? 0), 0);
  const highValueOrders = safeAggregateOrders.filter(
    (order) => Number(order.total_sum ?? 0) >= 50000,
  ).length;

  const cityMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();

  safeAggregateOrders.forEach((order) => {
    const city = order.city ?? "Не указан";
    cityMap.set(city, (cityMap.get(city) ?? 0) + 1);

    const source = order.utm_source ?? "unknown";
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  });

  return {
    stats: {
      recentOrders: safeAggregateOrders.length,
      revenueRecent: totalRevenue,
      highValueOrders,
    },
    recentOrders: safeRecentOrders,
    dailySales: safeSales.map((row) => ({
      day: row.day,
      orders: Number(row.orders_count ?? 0),
      revenue: Number(row.revenue ?? 0),
    })),
    cities: [...cityMap.entries()].map(([city, orders]) => ({ city, orders })),
    sources: [...sourceMap.entries()].map(([source, orders]) => ({ source, orders })),
  };
}
