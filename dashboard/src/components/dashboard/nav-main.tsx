'use client';
import {
  Home,
  MessageCircle,
  Quote,
  Share2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

export function DashboardNavMain(
  props: ComponentPropsWithoutRef<typeof SidebarGroup>,
) {
  const { setOpenMobile } = useSidebar();

  const items: Array<MenuItem> = [
    {
      title: 'Home',
      icon: Home,
      href: '/',
    },
    {
      title: 'Phrases',
      icon: Quote,
      href: '/phrases',
    },
    {
      title: 'Profiles',
      icon: Users,
      href: '/profiles',
    },
    {
      title: 'Socials',
      icon: Share2,
      href: '/socials',
    },
    {
      title: 'Feedbacks',
      icon: MessageCircle,
      href: '/feedbacks',
    },
  ];

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                onClick={() => setOpenMobile(false)}
              >
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
