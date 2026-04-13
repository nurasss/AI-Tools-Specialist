import dotenv from "dotenv";
import { notifyHighValueOrders } from "@/lib/telegram";

dotenv.config({ path: ".env.local" });

async function main() {
  const result = await notifyHighValueOrders();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
