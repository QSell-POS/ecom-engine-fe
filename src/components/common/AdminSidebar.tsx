"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarMenuAction,
  // SidebarMenuSub,
  // SidebarMenuSubButton,
  // SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TbListDetails, TbLogout, TbSettings } from "react-icons/tb";
import { TbTriangles } from "react-icons/tb";
// import { TbBrandUnity } from "react-icons/tb";
// import { TbChecklist } from "react-icons/tb";
// import { TbCertificate } from "react-icons/tb";
// import { TbBarcode } from "react-icons/tb";
// import { TbQrcode } from "react-icons/tb";
import { TbLayoutGrid } from "react-icons/tb";
import { TbUserEdit } from "react-icons/tb";
import { TbBox } from "react-icons/tb";
import { TbTablePlus } from "react-icons/tb";
// import { TbProgressAlert } from "react-icons/tb";
// import { TbTrendingUp2 } from "react-icons/tb";
// import { TbCarouselVertical } from "react-icons/tb";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "../ui/collapsible";
// import { TbChevronDownFilled } from "react-icons/tb";
import { IconType } from "react-icons/lib";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { cn } from "@/lib/utils";

interface SubMenu {
  id: number;
  icon: IconType;
  label: string;
  link?: string;
}

interface MenuItem extends SubMenu {
  link?: string;
  children?: SubMenu[];
}

interface Menu {
  id: number;
  label: string;
  items: MenuItem[];
}

const menuData: Menu[] = [
  {
    id: 1,
    label: "Main",
    items: [
      {
        id: 1,
        icon: TbLayoutGrid,
        label: "Dashboard",
        link: "/",
        // children: [
        //   { id: 1, icon: TbLayoutGrid, label: "Sub Menu 1" },
        //   { id: 2, icon: TbLayoutGrid, label: "Sub Menu 2" },
        // ],
      },
      {
        id: 2,
        icon: TbUserEdit,
        label: "Super Admin",
      },
    ],
  },
  {
    id: 2,
    label: "Inventory",
    items: [
      {
        id: 1,
        icon: TbBox,
        label: "Products",
        link: "/products",
      },
      {
        id: 2,
        icon: TbTablePlus,
        label: "Create Product",
        link: "/products/create",
      },
      // {
      //   id: 3,
      //   icon: TbProgressAlert,
      //   label: "ExpiredProducts",
      // },
      // {
      //   id: 4,
      //   icon: TbTrendingUp2,
      //   label: "Low Stocks",
      // },
      {
        id: 5,
        icon: TbListDetails,
        label: "Category",
        link: "/categories",
      },
      // {
      //   id: 6,
      //   icon: TbCarouselVertical,
      //   label: "Sub Category",
      // },
      {
        id: 7,
        icon: TbTriangles,
        label: "Brands",
        link: "/brand",
      },
      // {
      //   id: 8,
      //   icon: TbBrandUnity,
      //   label: "Units",
      // },
      // {
      //   id: 9,
      //   icon: TbChecklist,
      //   label: "Variant Attributes",
      // },
      // {
      //   id: 10,
      //   icon: TbCertificate,
      //   label: "Warranties",
      // },
      // {
      //   id: 11,
      //   icon: TbBarcode,
      //   label: "Print Barcode",
      // },
      // {
      //   id: 12,
      //   icon: TbQrcode,
      //   label: "Print QR Code",
      // },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isMenuItemActive(link?: string) {
    if (!link) return false;
    if (link === "/products") {
      return pathname === link || pathname.startsWith(`${link}/`);
    }
    return pathname === link;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="">
        <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group-data-[collapsible=icon]:hidden"
          >
            <span className="flex size-6 items-center justify-center bg-accent-foreground text-sm text-primary-foreground">
              E
            </span>
            <span className="truncate text-sm font-normal">Ecom Engine</span>
          </Link>
          <SidebarTrigger size="lg" />
        </div>
      </SidebarHeader>
      <SidebarRail />
      <SidebarContent>
        {menuData.map((data: Menu) => (
          <SidebarGroup key={data.id}>
            <SidebarGroupLabel>{data.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              {data.items.map((item) => {
                const isActive = isMenuItemActive(item.link);

                console.log(isActive);

                return (
                  <SidebarMenu key={item.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.link ?? "/"}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {/* {item.children && item.children.length > 0 && (
                        <Collapsible key={item.id} defaultOpen>
                          <SidebarMenuAction asChild>
                            <CollapsibleTrigger>
                              <TbChevronDownFilled />
                            </CollapsibleTrigger>
                          </SidebarMenuAction>
                          {item.children.map((child) => (
                            <CollapsibleContent key={child.id}>
                              <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton>
                                    <child.icon color="#646B72" />
                                    {child.label}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          ))}
                        </Collapsible>
                      )} */}
                    </SidebarMenuItem>
                  </SidebarMenu>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <Footer />
    </Sidebar>
  );
}

function Footer() {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <TbSettings className="text-[#646B72]" />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <TbLogout className="text-[#646B72]" />
            <span>Logout</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
