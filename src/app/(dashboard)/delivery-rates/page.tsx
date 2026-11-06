import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateDeliveryRateButton } from "@/components/delivery-rate/DeliveryRateFormDialog";
import { DeliveryRatesGrid } from "@/components/delivery-rate/DeliveryRatesGrid";
import { getDeliveryRates } from "@/lib/api/delivery-rate/service";
import { denyUnless } from "@/lib/api/rbac/access";
import { Can } from "@/components/auth/PermissionsProvider";

export const metadata: Metadata = { title: "Delivery rates" };

export default async function DeliveryRatesPage() {
  const denied = await denyUnless("delivery:view");
  if (denied) return denied;

  // This route is not paginated: it returns every rate in one array.
  const rates = await getDeliveryRates();

  return (
    <>
      <PageHeader
        title="Delivery rates"
        description="What shipping costs, by where the order is going. Checkout quotes from these."
        actions={<Can I="delivery:manage"><CreateDeliveryRateButton /></Can>}
      />
      <DeliveryRatesGrid rates={rates} />
    </>
  );
}
