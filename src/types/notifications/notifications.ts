export interface Notification {
  id: string;
  targetUserId: string;
  postId: string;
  type: NotificationType;
  text: string;
  commentId?: string;
  isReaded?: boolean;
}

export enum NotificationType {
  NewPost = 'new post',
  CommentPost = 'comment post',
  NewTrip = 'new trip',
  CommentTrip = 'comment trip',
  NewReplyTrip = 'new reply trip',
  NewReplyPost = 'new reply post',
}
