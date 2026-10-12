import type {Metadata} from 'next';
import {DashboardDemo} from '../../../components/dashboard-demo';
export const metadata:Metadata={
 title:'Dashboard demo | Episode Holding',
 description:'სატესტო დეშბორდის პრევიუ. გამოიყენება მხოლოდ გამოგონილი მონაცემები, რეგისტრაციისა და რეალურ მონაცემებზე წვდომის გარეშე.',
 robots:{index:false,follow:false},
};
export default function DashboardDemoPage(){return <DashboardDemo/>;}
