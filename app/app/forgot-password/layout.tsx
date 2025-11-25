// Disable static generation for auth pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
