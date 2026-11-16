import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Gender equality · UN data',description:'Compare country trends using UNDP Human Development Report 2025 data.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
