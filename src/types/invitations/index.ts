export interface IInvitation {
  createdAt: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'rejected';
  id: string;
}
