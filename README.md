# GBC Analytics Dashboard

Решение тестового задания для репозитория `gbc-analytics-dashboard`.

Проект реализует полный поток:

- загрузка `mock_orders.json` в RetailCRM;
- синхронизация заказов из RetailCRM в Supabase;
- дашборд на Next.js с графиком по данным из Supabase;
- Telegram-уведомления для заказов выше `50 000 ₸`;
- cron endpoint для Vercel.

## Стек

- Next.js 15 + TypeScript
- Supabase
- Recharts
- Vercel Cron Jobs
- Telegram Bot API
- RetailCRM API v5

## Структура

- `src/app/page.tsx` — главная страница дашборда
- `src/app/api/cron/notify/route.ts` — защищённый cron endpoint
- `src/lib/env.ts` — валидация env
- `src/lib/retailcrm.ts` — клиент RetailCRM API
- `src/lib/orders.ts` — sync и агрегаты для дашборда
- `src/lib/telegram.ts` — Telegram-уведомления
- `scripts/upload-mock.ts` — загрузка 50 мок-заказов в RetailCRM
- `scripts/sync-orders.ts` — синхронизация RetailCRM -> Supabase
- `scripts/test-notify.ts` — ручной запуск уведомлений
- `supabase/schema.sql` — схема базы данных
- `vercel.json` — cron-конфиг для продакшена

## Быстрый старт

1. Установи Node.js 20+.
2. Скопируй `.env.example` в `.env.local`.
3. Заполни ключи:
   - `RETAILCRM_URL`
   - `RETAILCRM_API_KEY`
   - `RETAILCRM_SITE`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Выполни SQL из `supabase/schema.sql` в Supabase SQL Editor.
5. Установи зависимости:

```bash
npm install
```

6. Загрузи моки в RetailCRM:

```bash
npm run upload:mock
```

7. Синхронизируй заказы в Supabase:

```bash
npm run sync:orders
```

8. Запусти локально:

```bash
npm run dev
```

## Переменные окружения

```env
# RetailCRM
RETAILCRM_URL="https://your-subdomain.retailcrm.ru"
RETAILCRM_API_KEY="your_api_key"
RETAILCRM_SITE="your_site_code"
# optional:
# RETAILCRM_ORDER_TYPE="your_order_type_code"
# RETAILCRM_ORDER_METHOD="your_order_method_code"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Telegram
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
ALERT_MIN_TOTAL=50000

# Vercel Cron
CRON_SECRET="replace-with-a-random-secret"
```

## Команды

```bash
npm run dev
npm run build
npm run lint
npm run upload:mock
npm run sync:orders
npm run notify:test
```

## Как работает решение

### 1. Загрузка заказов

Скрипт `upload:mock` читает `mock_orders.json` и отправляет массив в `RetailCRM /api/v5/orders/upload` через `application/x-www-form-urlencoded`, как требует API.

Если в демо-аккаунте отличаются коды `orderType` или `orderMethod`, можно переопределить их через:

- `RETAILCRM_ORDER_TYPE`
- `RETAILCRM_ORDER_METHOD`

Если эти переменные не заданы, скрипт удаляет `orderType/orderMethod` из моков и даёт RetailCRM выбрать дефолтные значения для API.

### 2. Синхронизация в Supabase

Скрипт `sync:orders`:

- забирает все заказы из RetailCRM c пагинацией;
- нормализует поля;
- считает `total_sum`, если RetailCRM не прислал готовую сумму;
- делает `upsert` в таблицу `orders`;
- обновляет `sync_state`.

### 3. Dashboard

Главная страница:

- показывает KPI;
- строит график по view `daily_sales`;
- показывает последние заказы;
- показывает группировки по городам и `utm_source`.

Если env ещё не заполнены, страница покажет setup-экран вместо ошибки.

### 4. Telegram

Сервис уведомлений:

- выбирает из Supabase заказы с `total_sum >= ALERT_MIN_TOTAL`;
- проверяет таблицу `telegram_notifications`;
- отправляет сообщение только для ещё не уведомлённых заказов;
- сохраняет `order_id`, чтобы не было дублей.

### 5. Vercel Cron

`vercel.json` вызывает:

- `GET /api/cron/notify` каждые 15 минут.

Endpoint:

- проверяет `Authorization: Bearer <CRON_SECRET>`, если секрет задан;
- запускает sync из RetailCRM;
- затем отправляет Telegram-уведомления.

## Деплой на Vercel

1. Импортируй репозиторий в Vercel.
2. Добавь все переменные окружения из `.env.local` в Project Settings.
3. Задеплой проект в production.
4. Убедись, что cron работает именно в production deployment.

## Что ещё нужно сделать для финальной сдачи

- добавить ссылку на задеплоенный Vercel dashboard;
- приложить скриншот Telegram-уведомления в `docs/telegram.png`;
- обновить этот README фактическими ссылками на прод;
- описать реальные промпты, сложности и решения.

## Какие промпты давал AI-инструменту

Ниже заготовка под обязательную часть README. Замените на фактическую историю перед сдачей:

1. `Проанализируй тестовое задание и предложи структуру проекта для RetailCRM -> Supabase -> Vercel -> Telegram.`
2. `Собери Next.js проект с TypeScript, скриптами sync/upload и SQL-схемой Supabase.`
3. `Сделай защищённый cron endpoint и идемпотентные Telegram-уведомления.`
4. `Оформи README так, чтобы по нему можно было быстро поднять решение и проверить его.`

## Где застрял и как решил

Заготовка для финального отчёта:

- Исходный репозиторий не содержал кода приложения, только описание задания и `mock_orders.json`.
  Решение: собрал проект с нуля и вынес интеграции в отдельные `lib`/`scripts`.
- У RetailCRM в демо-аккаунтах могут не совпадать коды `orderType` и `orderMethod`.
  Решение: добавил env-переопределение кодов, чтобы не редактировать моки вручную.
- Telegram-уведомления нельзя дублировать при повторном запуске cron.
  Решение: добавил таблицу `telegram_notifications` с `order_id` как primary key.

## Чеклист перед отправкой

- `npm run upload:mock` загрузил 50 заказов в RetailCRM
- `npm run sync:orders` записал данные в Supabase
- дашборд открыт по публичной ссылке Vercel
- Telegram прислал уведомление о заказе выше порога
- `docs/telegram.png` добавлен в репозиторий
- секреты не закоммичены
