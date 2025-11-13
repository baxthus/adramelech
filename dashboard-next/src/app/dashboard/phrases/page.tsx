import DashboardInset from '@/components/dashboard/inset';

export default function PhrasesPage() {
  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Phrases',
          href: '/dashboard/phrases',
        },
      ]}
    >
      <div>Phrases Page</div>
    </DashboardInset>
  );
}
