'use client';
import { SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownItemProps,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { Icon, IconLogout } from '@tabler/icons-react';
import { redirect } from 'next/navigation';

export default function UserButton() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) redirect('/sign-in');

  const items: Array<{
    key: string;
    content: string | React.ReactNode;
    href?: string;
    action?: () => void;
    as?: React.ElementType;
    color?: DropdownItemProps['color'];
    icon?: Icon;
  }> = [
    {
      key: 'profile',
      content: (
        <>
          <p className="font-bold">Signed in as</p>
          <p>
            {user.firstName ||
              user.username ||
              user.emailAddresses[0].emailAddress}
          </p>
        </>
      ),
      href: '/profile',
    },
    {
      key: 'sign-out',
      content: 'Sign out',
      action: signOut,
      color: 'danger',
      icon: IconLogout,
    },
  ];

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            color="secondary"
            as="button"
            src={user.imageUrl}
            fallback={
              user.firstName?.[0] ||
              user.username?.[0] ||
              user.emailAddresses[0].emailAddress[0]
            }
          />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Profile Actions"
          variant="flat"
          onAction={(key) => {
            const item = items.find((item) => item.key === key);
            if (item?.action) item.action();
          }}
        >
          {items.map((item) => (
            <DropdownItem
              key={item.key}
              href={item.href}
              as={item.as}
              color={item.color}
              startContent={
                item.icon ? <item.icon stroke={1.5} size={20} /> : undefined
              }
            >
              {item.content}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
