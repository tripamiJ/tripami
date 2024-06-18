export interface ITravel {
  id: string;
  userId: string;
  imageUrl: { url: string; type: string; description?: string }[];
  rate: number;
  startDate: string;
  endDate: string;
  geoTags: {
    placeID: string;
    address: string;
  }[];
  cities?: {
    placeID: string;
    address: string;
  }[];
  pinColor: string;
  text: string;
  tripName: string;
  dayDescription?: { date: string; description: string }[];
  comments_count?: number;
}
