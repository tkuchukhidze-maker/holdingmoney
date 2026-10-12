import type {Metadata} from 'next';
import {MagnoliaOffer} from '../../../../../components/magnolia-site';
export const metadata:Metadata={title:'Hotel Offer | Hotel Magnolia Tbilisi'};
export default async function Page({params}:{params:Promise<{offer:string}>}){return <MagnoliaOffer slug={(await params).offer}/>;}
