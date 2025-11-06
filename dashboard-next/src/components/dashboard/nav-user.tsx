'use client';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ChevronsUpDown, Github, LogOut, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { env } from '@/env';

const UserView = ({
  user,
  identifier,
}: {
  user: ReturnType<typeof useUser>['user'];
  identifier: string;
}) => (
  <>
    <Avatar className="size-8 rounded-lg">
      <AvatarImage src={user?.imageUrl} alt={identifier} />
      <AvatarFallback className="rounded-lg">
        {identifier.charAt(0)}
      </AvatarFallback>
    </Avatar>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{identifier}</span>
      <span className="truncate text-xs">
        {user?.emailAddresses[0]?.emailAddress}
      </span>
    </div>
  </>
);

export function NavUser() {
  const { user, openUserProfile, signOut } = useClerk();
  const { isMobile } = useSidebar();

  const identifier =
    user?.firstName ||
    user?.username ||
    user?.emailAddresses[0]?.emailAddress ||
    'User';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <UserView user={user} identifier={identifier} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserView user={user} identifier={identifier} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openUserProfile()}>
                <User />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={env.NEXT_PUBLIC_REPOSITORY_URL} target="_blank">
                  <Github />
                  Source Code
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  signOut();
                  redirect('/sign-in');
                }}
              >
                <LogOut />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
