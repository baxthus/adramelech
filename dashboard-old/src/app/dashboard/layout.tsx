import DashboardNavbar from './navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNavbar />
      <main className="p-4">{children}</main>
    </>
  );
}
