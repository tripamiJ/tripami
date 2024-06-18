export interface IPost {
  id: string;
  imageUrls: string[];
  text: string;
  comments_count: number;
  userId: string;
  likes: string[];
  createAt: string;
  comments: IComment[];
}

interface IComment {
  userId: string;
  text: string;
  likes: number;
  comments_count: number;
  comments: [];
}
