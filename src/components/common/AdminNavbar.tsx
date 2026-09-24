"use client";
import {
  TbMail,
  TbBell,
  TbMaximize,
  TbSearch,
  TbSettings,
} from "react-icons/tb";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Button } from "../ui/button";
import { ReactNode } from "react";

type IconButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

const IconButton = ({ label, icon, onClick }: IconButtonProps) => {
  return (
    <Button
      aria-label={label}
      className="bg-accent hover:bg-accent/80"
      onClick={onClick}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      {icon}
    </Button>
  );
};

export const AdminNavbar = () => {
  const handleMaximize = () => undefined;
  const handleMessages = () => undefined;
  const handleNotifications = () => undefined;
  const handleSettings = () => undefined;

  return (
    <div className="relative shrink-0 border-b bg-background border-b-gray-300">
      <div className="px-8 py-4 w-full flex items-center justify-between">
        <InputGroup className="w-64 bg-background">
          <InputGroupAddon>
            <TbSearch />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search" />
        </InputGroup>

        <div className="flex gap-2 items-center">
          <IconButton
            icon={<TbMaximize />}
            label="Maximize"
            onClick={handleMaximize}
          />
          <IconButton
            icon={<TbMail />}
            label="Messages"
            onClick={handleMessages}
          />
          <IconButton
            icon={<TbBell />}
            label="Notifications"
            onClick={handleNotifications}
          />
          <IconButton
            icon={<TbSettings />}
            label="Settings"
            onClick={handleSettings}
          />
        </div>
      </div>
    </div>
  );
};
