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

export type Stream = {
  id: string;
  title: string;
  thumbnail?: string;
  ingressId?: string;
  serverUrl?: string;
  streamKey?: string;
  isLive: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  userId: User["id"];
  user: User;
  createdAt: string;
};
