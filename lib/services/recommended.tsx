import { createClient } from "@supabase/supabase-js";
import { getSelf } from "@/lib/services/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    // Отримати всіх користувачів, окрім себе
    const { data: allUsers, error: userError } = await supabase
      .from("User")
      .select(
        `
        id,
        email,
        username,
        stream(isLive),
        createdAt
      `
      )
      .neq("id", userId)
      .order("createdAt", { ascending: false });

    if (userError) throw new Error(userError.message);

    // Отримати списки підписок та блокувань
    const { data: following, error: followingError } = await supabase
      .from("Follow")
      .select("following_id")
      .eq("follower_id", userId);

    const { data: blocked, error: blockedError } = await supabase
      .from("Block")
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
    // Для гостей
    const { data, error } = await supabase
      .from("User")
      .select(
        `
        id,
        email,
        username,
        stream(isLive),
        createdAt
      `
      )
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    users = data || [];
  }

  return users;
};
