'use client';
import {
  Home,
  MessageCircle,
  Quote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

export function DashboardNavMain(
  props: ComponentPropsWithoutRef<typeof SidebarGroup>,
) {
  const pathname = usePathname();

  const items: Array<MenuItem> = [
    {
      title: 'Home',
      icon: Home,
      href: '/dashboard',
    },
    {
      title: 'Phrases',
      icon: Quote,
      href: '/dashboard/phrases',
    },
    {
      title: 'Profiles',
      icon: Users,
      href: '/dashboard/profiles',
    },
    {
      title: 'Feedbacks',
      icon: MessageCircle,
      href: '/dashboard/feedbacks',
    },
  ];

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href}>
                  <item.icon />
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
