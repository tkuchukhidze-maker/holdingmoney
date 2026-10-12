import type { Metadata } from 'next';
import { RestaurantSelection } from '../../components/restaurant-selection';

export const metadata: Metadata = {
  title: 'Our Restaurants — Episode Holding',
  description: 'Choose a restaurant in Batumi, Tbilisi or Kutaisi. Select your date, time and guests to find a table and discover the programme for your visit.',
};

export default function Page() {
  return <RestaurantSelection />;
}
