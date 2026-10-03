import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateDeliveryRateButton } from "@/components/delivery-rate/DeliveryRateFormDialog";
import { DeliveryRatesGrid } from "@/components/delivery-rate/DeliveryRatesGrid";
import { getDeliveryRates } from "@/lib/api/delivery-rate/service";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Delivery rates" };

export default async function DeliveryRatesPage() {
  const rates = await loadAllPages(getDeliveryRates);

  return (
    <>
      <PageHeader
        title="Delivery rates"
        description="What shipping costs, by where the order is going. Checkout quotes from these."
        actions={<CreateDeliveryRateButton />}
      />
      <DeliveryRatesGrid rates={rates} />
    </>
  );
}
