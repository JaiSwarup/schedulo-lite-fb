"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserNav } from "./UserNav";
import { Home, CalendarDays, UserCircle, ShieldCheck, Settings, CalendarPlus, GanttChartSquare, LogOut, PanelLeft } from "lucide-react";
import type { FirebaseUser } from "@/lib/types";
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar

interface AppSidebarProps {
  user: FirebaseUser | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { toggleSidebar, state: sidebarState, isMobile } = useSidebar();

  const ScheduloLogo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
      <GanttChartSquare className="h-8 w-8 text-primary" />
      {sidebarState === "expanded" && !isMobile && (
         <h1 className="text-xl font-bold text-primary">Schedulo Lite</h1>
      )}
    </Link>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex justify-between items-center">
         <ScheduloLogo />
         {sidebarState === "expanded" && !isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
              <PanelLeft />
            </Button>
         )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "ml-2" }}
                  aria-label={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}

          {user?.isAdmin && (
            <SidebarGroup className="mt-4 p-0">
              {sidebarState === 'expanded' && <SidebarGroupLabel className="px-2">Admin</SidebarGroupLabel>}
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                   <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      isActive={pathname === item.href || pathname.startsWith(item.href)}
                      tooltip={{ children: item.label, className: "ml-2" }}
                      aria-label={item.label}
                    >
                      <item.icon />
                       <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <UserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
