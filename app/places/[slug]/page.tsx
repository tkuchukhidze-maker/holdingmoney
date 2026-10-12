import { VenueWebsiteRouter } from '../../../components/restaurant-brand';
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  return <VenueWebsiteRouter slug={(await params).slug}/>;
}
