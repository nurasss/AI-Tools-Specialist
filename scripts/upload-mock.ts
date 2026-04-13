import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { requireRetailCrmEnv } from "@/lib/env";
import { normalizeMockOrderType, retailCrmPostForm } from "@/lib/retailcrm";

dotenv.config({ path: ".env.local" });

type MockOrder = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  orderType?: string;
  orderMethod?: string;
  status?: string;
  items: Array<{ productName: string; quantity: number; initialPrice: number }>;
  delivery?: { address?: { city?: string; text?: string } };
  customFields?: { utm_source?: string };
};

async function main() {
  const env = requireRetailCrmEnv();
  const file = path.join(process.cwd(), "mock_orders.json");
  const raw = await fs.readFile(file, "utf-8");
  const orders = JSON.parse(raw) as MockOrder[];

  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error("mock_orders.json must contain a non-empty array");
  }

  const payloadOrders = orders.map((order) => normalizeMockOrderType(order));
  const result = await retailCrmPostForm<{
    uploadedOrders?: unknown[];
    errors?: unknown;
  }>("orders/upload", {
    site: env.RETAILCRM_SITE,
    orders: JSON.stringify(payloadOrders),
  });

  console.log(
    JSON.stringify(
      {
        uploaded: payloadOrders.length,
        result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
