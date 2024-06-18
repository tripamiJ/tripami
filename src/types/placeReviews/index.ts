export interface PlaceReviewType {
  id: string;
  authorAvatar: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  images: { url: string; type: string }[];
  placeId: string;
  rate: number;
  text: string;
}
