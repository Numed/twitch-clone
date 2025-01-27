import { getSelf } from "@/lib/services/auth";
import { supabase } from "./init";

export const getRecommended = async () => {
  let userId: string | null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  let users: unknown = [];
  if (userId) {
    const { data: allUsers, error: userError } = await supabase
      .from("user")
      .select(
        `
        id,
        user_id,
        email,
        username,
        stream(isLive),
        created_at
      `
      )
      .neq("user_id", userId)
      .order("created_at", { ascending: false });

    if (userError) throw new Error(userError.message);

    const { data: following, error: followingError } = await supabase
      .from("follow")
      .select("following_id")
      .eq("follower_id", userId);

    const { data: blocked, error: blockedError } = await supabase
      .from("block")
      .select("blocked_id")
      .eq("blocker_id", userId);

    if (followingError || blockedError) {
      throw new Error(followingError?.message || blockedError?.message);
    }

    const followingIds = following?.map((f) => f.following_id) || [];
    const blockedIds = blocked?.map((b) => b.blocked_id) || [];

    users =
      allUsers?.filter(
        (u) => !followingIds.includes(u.id) && !blockedIds.includes(u.id)
      ) || [];
  } else {
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        id,
        user_id,
        email,
        username,
        stream(isLive),
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    users = data || [];
  }

  return users;
};
