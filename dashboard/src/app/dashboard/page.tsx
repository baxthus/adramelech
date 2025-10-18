'use client';
import places from '@/app/places';
import { Card, CardBody } from '@heroui/react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
      {places.map((place) => (
        <Card
          key={place.key}
          isPressable
          shadow="sm"
          as={Link}
          href={place.href}
          className="w-40 sm:w-48"
        >
          <CardBody className="flex items-center">
            <place.icon size={64} stroke={1} />
            <p className="m-2 text-3xl">{place.name}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
