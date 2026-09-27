"use client";

import { createContext, useContext, type ReactNode } from "react";

type EditorBridge = {
  selectedBlockId: string | null;
  selectBlock: (sectionId: string, blockId: string) => void;
};

const EditorBridgeContext = createContext<EditorBridge | null>(null);

export const EditorBridgeProvider = EditorBridgeContext.Provider;

// Wraps a block so it can be clicked/selected inside the theme editor canvas.
// On the live storefront there is no provider, so it renders a plain element.
export function EditableBlock({
  sectionId,
  blockId,
  className,
  children,
}: {
  sectionId: string;
  blockId: string;
  className?: string;
  children: ReactNode;
}) {
  const bridge = useContext(EditorBridgeContext);

  if (!bridge) return <div className={className}>{children}</div>;

  const isSelected = bridge.selectedBlockId === blockId;

  return (
    <div
      data-block-id={blockId}
      className={`${className ?? ""} relative cursor-pointer rounded-[2px] outline-offset-2 transition-[outline-color] duration-150 ${
        isSelected
          ? "outline-2 outline-selection"
          : "outline-1 outline-transparent hover:outline-selection/70"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        bridge.selectBlock(sectionId, blockId);
      }}
    >
      {children}
    </div>
  );
}
