import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import type { ComponentProps } from 'react';
import Logo from '../logo';
import { DashboardNavUser } from './nav-user';
import { DashboardNavMain } from './nav-main';

export function DashboardSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
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
