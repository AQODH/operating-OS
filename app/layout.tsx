import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AQODH | Organization workspace', description: 'Member finance and governance workspace for a supervised trial' };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en"><body>{children}</body></html>; }
