import type { Metadata } from 'next';
import './globals.css';
import PersonalNotebook from '../components/PersonalNotebook';
import PublicChat from '../components/PublicChat';
export const metadata: Metadata = {title:'GE / World Data',description:'Compare countries across development, gender equality, climate, poverty, health, education and conflict using public international data.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}<PersonalNotebook/><PublicChat/></body></html>;}
