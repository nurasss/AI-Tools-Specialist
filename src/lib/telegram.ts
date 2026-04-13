import { getOptionalEnv, requireTelegramEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

type NotifiedOrder = {
  id: number;
  customer_name: string | null;
  total_sum: number | null;
  city: string | null;
  created_at: string | null;
};

export async function sendTelegramMessage(text: string) {
  const env = requireTelegramEnv();
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
    }),
    cache: "no-store",
  });

  const json = await response.json();
  if (!response.ok || json.ok !== true) {
    throw new Error(`Telegram sendMessage failed: HTTP ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

function formatOrderMessage(order: NotifiedOrder) {
  return [
    "Новый заказ выше порога",
    `ID: ${order.id}`,
    `Клиент: ${order.customer_name ?? "Не указан"}`,
    `Сумма: ${Number(order.total_sum ?? 0).toLocaleString("ru-RU")} ₸`,
    `Город: ${order.city ?? "Не указан"}`,
    `Создан: ${order.created_at ?? "Неизвестно"}`,
  ].join("\n");
}

export async function notifyHighValueOrders() {
  const appEnv = getOptionalEnv();
  const supabase = createSupabaseAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, total_sum, city, created_at")
    .gte("total_sum", appEnv.ALERT_MIN_TOTAL)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Supabase high-value query failed: ${error.message}`);
  }

  let notified = 0;
  for (const order of orders ?? []) {
    const { data: existing, error: existingError } = await supabase
      .from("telegram_notifications")
      .select("order_id")
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Supabase notification lookup failed: ${existingError.message}`);
    }

    if (existing) {
      continue;
    }

    await sendTelegramMessage(formatOrderMessage(order));

    const { error: insertError } = await supabase.from("telegram_notifications").insert({
      order_id: order.id,
    });

    if (insertError) {
      throw new Error(`Supabase notification insert failed: ${insertError.message}`);
    }

    notified += 1;
  }

  return { notified };
}
