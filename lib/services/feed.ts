import { getSelf } from "@/lib/services/auth";
import { supabase } from "./init";

export const getStreams = async () => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  const baseQuery = supabase
    .from("stream")
    .select("id, user:user_id, isLive, title, thumbnail")
    .order("isLive", { ascending: false });

  if (userId) {
    baseQuery.not("user->blocking->some->blockedId", "eq", userId);
  }

  const { data: streams, error } = await baseQuery;

  if (error) {
    console.error("Error fetching streams:", error.message);
    return [];
  }

  return streams || [];
};
