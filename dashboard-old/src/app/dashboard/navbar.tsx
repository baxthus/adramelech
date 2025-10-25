'use client';
import Logo from '@/components/Logo';
import UserButton from '@/components/UserButton';
import { Link, Navbar, NavbarBrand, NavbarContent } from '@heroui/react';

export default function DashboardNavbar() {
  return (
    <Navbar isBordered maxWidth="full">
      <NavbarBrand>
        <Link color="foreground" href="/dashboard">
          <Logo className="text-xl" />
        </Link>
      </NavbarBrand>

      <NavbarContent as="div" justify="end">
        <UserButton />
      </NavbarContent>
    </Navbar>
  );
}
