create table if not exists orders (
  id bigint primary key,
  number text,
  external_id text,
  created_at timestamptz,
  status text,
  total_sum numeric,
  city text,
  utm_source text,
  customer_name text,
  phone text,
  email text,
  items jsonb not null default '[]'::jsonb,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_total_sum on orders (total_sum desc);
create index if not exists idx_orders_city on orders (city);
create index if not exists idx_orders_utm_source on orders (utm_source);

create table if not exists sync_state (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists telegram_notifications (
  order_id bigint primary key,
  notified_at timestamptz not null default now()
);

create or replace view daily_sales as
select
  date_trunc('day', created_at) as day,
  count(*) as orders_count,
  coalesce(sum(total_sum), 0) as revenue
from orders
group by 1
order by 1;
