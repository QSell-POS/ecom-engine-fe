"use client";

import type { ReactNode } from "react";
import type { HomeData } from "@/lib/storefront/types";
import type { SectionInstance, ThemeDocument } from "@/lib/theme-engine/types";
import { SECTION_COMPONENTS } from "./sections";

/**
 * Renders a theme's home page sections. Chrome (header, footer) and theme
 * variables come from the surrounding <StoreFrame>/<StoreChrome>, so the same
 * sections render on the live store, in previews and in the builder canvas.
 */
export function ThemeRenderer({
  document,
  data,
  renderSection,
  after,
}: {
  document: ThemeDocument;
  data: HomeData;
  /** Builder hook to wrap each rendered section (selection outline, toolbar). */
  renderSection?: (section: SectionInstance, index: number, node: ReactNode) => ReactNode;
  after?: ReactNode;
}) {
  return (
    <>
      {document.sections.map((section, index) => {
        const Component = SECTION_COMPONENTS[section.type];
        if (!Component) return null;
        const node = <Component section={section} data={data} />;
        return renderSection ? (
          <div key={section.id}>{renderSection(section, index, node)}</div>
        ) : (
          <div key={section.id} data-section-type={section.type}>
            {node}
          </div>
        );
      })}
      {after}
    </>
  );
}
