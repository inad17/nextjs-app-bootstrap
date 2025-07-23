import './globals.css';

export const metadata = {
  title: 'Request Queue App',
  description: 'Manage your request queue',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
