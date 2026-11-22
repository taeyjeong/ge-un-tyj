import {redirect} from 'next/navigation';
// Part 2a now lives on the single Peace agreements page; keep old links working.
export default function Page() {redirect('/peace-agreements#part-2a');}
