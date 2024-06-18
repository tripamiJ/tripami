export interface UpdatedDateJournal {
  place: { address: string; placeID: string }[];
  date: string;
  description: string;
  photos: { url: string; type: string }[];
};