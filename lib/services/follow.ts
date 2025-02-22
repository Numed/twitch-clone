import { supabase } from "./init";
import { getSelf } from "@/lib/services/auth";

export const isFollowingUser = async (id: number) => {
  try {
    const self = await getSelf();

    const { data: existingFollow, error } = await supabase
      .from("follow")
      .select("id")
      .eq("follower_id", self.id)
      .eq("following_id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return !!existingFollow;
  } catch {
    return false;
  }
};

export const followUser = async (id: number) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("Cannot follow yourself");
  }

  const { data: existingFollow, error: findError } = await supabase
    .from("follow")
    .select("id")
    .eq("follower_id", self.id)
    .eq("following_id", id)
    .single();

  if (findError && findError.code !== "PGRST116") {
    throw new Error(findError.message);
  }

  if (existingFollow) {
    throw new Error("Already following");
  }

  const { data: follow, error } = await supabase
    .from("follow")
    .insert({
      follower_id: self.id,
      following_id: id,
    })
    .select();

  if (error) throw new Error(error.message);
  return follow;
};

export const unfollowUser = async (id: number) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("Cannot unfollow yourself");
  }

  const { data: existingFollow, error: findError } = await supabase
    .from("follow")
    .select("id")
    .eq("follower_id", self.id)
    .eq("following_id", id)
    .single();

  if (findError && findError.code !== "PGRST116") {
    throw new Error(findError.message);
  }

  if (!existingFollow) {
    throw new Error("Not following");
  }

  const { data: follow, error } = await supabase
    .from("follow")
    .delete()
    .eq("id", existingFollow.id)
    .select();

  if (error) throw new Error(error.message);
  return follow;
};

export const getFollowedUsers = async () => {
  try {
    const self = await getSelf();

    const { data: followedUsers, error } = await supabase
      .from("follow")
      .select(
        `
        following (
          id,
          email,
          username,
          stream(isLive)
        )
      `
      )
      .eq("follower_id", self.id);

    if (error) throw new Error(error.message);
    return followedUsers;
  } catch {
    return [];
  }
};
