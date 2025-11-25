// Disable static generation for dashboard pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayout({
  children


}: {children: React.ReactNode;}) {
  return children;
}