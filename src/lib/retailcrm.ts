import { requireRetailCrmEnv } from "@/lib/env";

type RetailCrmResponse<T> = { success: boolean } & T;

export type RetailCrmOrder = {
  id: number;
  number?: string;
  externalId?: string;
  createdAt?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  totalSumm?: number;
  items?: Array<{
    productName?: string;
    quantity?: number;
    initialPrice?: number;
    prices?: Array<{ price?: number }>;
  }>;
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  customFields?: {
    utm_source?: string;
  };
};

function apiUrl(path: string) {
  const env = requireRetailCrmEnv();
  const url = new URL(`${env.RETAILCRM_URL.replace(/\/$/, "")}/api/v5/${path}`);
  url.searchParams.set("apiKey", env.RETAILCRM_API_KEY);
  return url;
}

export async function retailCrmPostForm<T>(
  path: string,
  form: Record<string, string>,
): Promise<RetailCrmResponse<T>> {
  const url = apiUrl(path);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form),
    cache: "no-store",
  });

  const json = (await response.json()) as RetailCrmResponse<T>;
  if (!response.ok || json.success !== true) {
    throw new Error(
      `RetailCRM POST ${path} failed: HTTP ${response.status} ${JSON.stringify(json)}`,
    );
  }

  return json;
}

export async function retailCrmGet<T>(
  path: string,
  query?: Record<string, string>,
): Promise<RetailCrmResponse<T>> {
  const url = apiUrl(path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url, { cache: "no-store" });
  const json = (await response.json()) as RetailCrmResponse<T>;

  if (!response.ok || json.success !== true) {
    throw new Error(
      `RetailCRM GET ${path} failed: HTTP ${response.status} ${JSON.stringify(json)}`,
    );
  }

  return json;
}

export function normalizeMockOrderType<
  T extends Record<string, unknown> & {
    orderType?: string;
    orderMethod?: string;
  },
>(order: T): T {
  const env = requireRetailCrmEnv();
  const copy = { ...order };

  delete copy.orderType;
  delete copy.orderMethod;

  if (env.RETAILCRM_ORDER_TYPE) {
    copy.orderType = env.RETAILCRM_ORDER_TYPE;
  }

  if (env.RETAILCRM_ORDER_METHOD) {
    copy.orderMethod = env.RETAILCRM_ORDER_METHOD;
  }

  return copy;
}
