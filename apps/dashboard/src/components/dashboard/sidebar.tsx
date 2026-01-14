'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Logo from '../logo';
import { DashboardNavUser } from './nav-user';
import { DashboardNavMain } from './nav-main';

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:h-auto md:h-14 md:border-b">
        <Logo className="self-center group-data-[collapsible=icon]:p-0" />
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavMain />
      </SidebarContent>
      <SidebarFooter>
        <DashboardNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
