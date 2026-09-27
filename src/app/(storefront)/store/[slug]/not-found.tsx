"use client";

import { SearchX } from "lucide-react";
import { EmptyState, StoreLink } from "@/components/storefront/primitives";

export default function StoreNotFound() {
  return (
    <div className="sf-container py-16">
      <EmptyState
        icon={<SearchX />}
        title="We couldn't find that page"
        text="It may have moved, sold out for good, or the link is mistyped."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <StoreLink href="/products" className="sf-btn sf-btn-primary">
              Shop all products
            </StoreLink>
            <StoreLink href="/" className="sf-btn sf-btn-secondary">
              Go to the home page
            </StoreLink>
          </div>
        }
      />
    </div>
  );
}
