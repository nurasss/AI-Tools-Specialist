import { DashboardChart } from "@/components/dashboard-chart";
import { getMissingServerEnv } from "@/lib/env";
import { getDashboardData } from "@/lib/orders";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return `${value.toLocaleString("ru-RU")} ₸`;
}

export default async function HomePage() {
  const missingEnv = getMissingServerEnv();

  if (missingEnv.length > 0) {
    return (
      <main className="page-shell">
        <section className="hero">
          <div className="hero-card">
            <span className="eyebrow">Setup Required</span>
            <h1>Dashboard skeleton is ready</h1>
            <p>
              Проект уже собран, но для реальных данных не хватает серверных переменных окружения.
              Заполни `.env.local`, примени `supabase/schema.sql`, затем запусти скрипты загрузки и синка.
            </p>
          </div>
        </section>

        <section className="setup-card">
          <h2>Что заполнить</h2>
          <p>
            {missingEnv.map((key) => (
              <code key={key}>{key}</code>
            ))}
          </p>
          <p>
            После этого используй `npm run upload:mock`, `npm run sync:orders`, `npm run dev`.
          </p>
        </section>
      </main>
    );
  }

  const data = await getDashboardData();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">RetailCRM → Supabase → Vercel</span>
          <h1>GBC analytics dashboard</h1>
          <p>
            Дашборд показывает последние заказы, динамику выручки по дням и помогает быстро проверить,
            что синхронизация и Telegram-оповещения действительно работают.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="panel stat-card">
          <strong>Последние заказы</strong>
          <span>{data.stats.recentOrders}</span>
        </article>
        <article className="panel stat-card">
          <strong>Общая выручка</strong>
          <span>{formatCurrency(data.stats.revenueRecent)}</span>
        </article>
        <article className="panel stat-card">
          <strong>Заказы выше 50 000 ₸</strong>
          <span>{data.stats.highValueOrders}</span>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Продажи по дням</h2>
              <p>Источник данных: view `daily_sales` в Supabase.</p>
            </div>
          </div>
          <DashboardChart data={data.dailySales} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Последние заказы</h2>
              <p>Свежие записи из таблицы `orders`.</p>
            </div>
          </div>
          <div className="list">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="list-row">
                <div>
                  <strong>{order.customer_name ?? `Заказ #${order.id}`}</strong>
                  <span>
                    {order.city ?? "Без города"} • {order.status ?? "Без статуса"}
                  </span>
                </div>
                <b>{formatCurrency(Number(order.total_sum ?? 0))}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="small-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Города</h2>
              <p className="list-meta">Сколько заказов пришло по каждому городу.</p>
            </div>
          </div>
          <div className="list">
            {data.cities.map((item) => (
              <div key={item.city} className="list-row">
                <div>
                  <strong>{item.city}</strong>
                  <span>Группировка по `delivery.address.city`</span>
                </div>
                <b>{item.orders}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>UTM source</h2>
              <p className="list-meta">Полезно для проверки маркетингового разреза.</p>
            </div>
          </div>
          <div className="list">
            {data.sources.map((item) => (
              <div key={item.source} className="list-row">
                <div>
                  <strong>{item.source}</strong>
                  <span>Источник из `customFields.utm_source`</span>
                </div>
                <b>{item.orders}</b>
              </div>
            ))}
          </div>
          <p className="hint">Cron endpoint `/api/cron/notify` можно вызывать вручную для проверки Telegram.</p>
        </article>
      </section>
    </main>
  );
}
