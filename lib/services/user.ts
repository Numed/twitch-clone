import { supabase } from "./init";

export const getUserByUsername = async (username: string) => {
  const { data: user, error } = await supabase
    .from("user")
    .select(
      `id, user_id, username, bio, image_url, 
      stream:stream(id, isLive, isChatDelayed, isChatEnabled, isChatFollowersOnly, thumbnail, title),
      followedBy:followed_by(count)`
    )
    .eq("username", username)
    .single();

  if (error) {
    throw new Error("Error fetching user by username");
  }

  return user;
};

export const getUserById = async (id: number) => {
  const { data: user, error } = await supabase
    .from("user")
    .select("*, stream:stream(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Error fetching user by ID");
  }

  return user;
};
