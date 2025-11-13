import DashboardInset from '@/components/dashboard/inset';

export default function ProfilesPage() {
  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Profiles',
          href: '/dashboard/profiles',
        },
      ]}
    >
      <div>Profiles Page</div>
    </DashboardInset>
  );
}
