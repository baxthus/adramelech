import DashboardInset from '@/components/dashboard/inset';
import Alert from '@/components/alert';
import * as z from 'zod/mini';

export default async function ProfileLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const isValid = z.uuid().safeParse(id).success;

  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Profiles',
          href: '/dashboard/profiles',
        },
        {
          title: isValid ? id : 'oops',
          href: `/dashboard/profiles/${id}`,
        },
      ]}
    >
      {isValid ? (
        children
      ) : (
        <Alert
          title="Invalid ID"
          description="The provided profile ID is not a valid UUID."
          variant="destructive"
        />
      )}
    </DashboardInset>
  );
}
