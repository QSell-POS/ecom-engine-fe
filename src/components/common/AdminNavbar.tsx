"use client";
import {
  TbMail,
  TbBell,
  TbMaximize,
  TbSearch,
  TbSettings,
} from "react-icons/tb";
import { Input } from "../ui/input";
import { ReactNode } from "react";

const IconWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="rounded p-1.5 bg-gray-100">{children}</div>;
};

export const AdminNavbar = () => {
  return (
    <div className="relative shrink-0 border-b border-b-gray-300">
      <div className="px-8 py-4 w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TbSearch />
          <Input className="border bg-background" />
        </div>
        <div className="flex gap-2 items-center">
          <IconWrapper>
            <TbMaximize />
          </IconWrapper>
          <IconWrapper>
            <TbMail />
          </IconWrapper>
          <IconWrapper>
            <TbBell />
          </IconWrapper>
          <IconWrapper>
            <TbSettings />
          </IconWrapper>
        </div>
      </div>
    </div>
  );
};
