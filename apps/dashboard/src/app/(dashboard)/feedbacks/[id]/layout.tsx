import DashboardInset from '@/components/dashboard/inset';
import Alert from '@/components/alert';
import { ArkErrors } from 'arktype';
import { NanoID } from '@repo/utils/types';

export default async function FeedbackLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const isValid = !(NanoID(id) instanceof ArkErrors);

  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Feedbacks',
          href: '/feedbacks',
        },
        {
          title: isValid ? id : 'Invalid ID',
          href: `/feedbacks/${id}`,
        },
      ]}
    >
      {isValid ? (
        children
      ) : (
        <Alert
          title="Invalid ID"
          description="The provided ID is not a valid nanoid"
          variant="destructive"
        />
      )}
    </DashboardInset>
  );
}
