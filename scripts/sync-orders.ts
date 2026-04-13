import dotenv from "dotenv";
import { runOrderSync } from "@/lib/orders";

dotenv.config({ path: ".env.local" });

async function main() {
  const result = await runOrderSync();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
