'use client';
import Logo from '@/components/Logo';
import { Button } from '@heroui/react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <Logo className="text-4xl" />
      <Button
        as={Link}
        href="/sign-in"
        color="secondary"
        variant="shadow"
        size="lg"
      >
        Sign in
      </Button>
    </div>
  );
}
