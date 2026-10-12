import { EventDetail } from '../../../components/catalog-pages';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <EventDetail slug={(await params).slug}/>;}
