export type User = {
  id: number;
  email: string;
  username: string;
  imageUrl: string;
  user_id: string;
  bio?: string;
  stream: {
    isLive: boolean;
  };
};

export type Follow = {
  id: number;
  follower: User;
  follower_id: string;
  following_id: string;
  following: User;
  user_id: string;
};