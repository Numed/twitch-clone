import { supabase } from "./init";
import { getSelf } from "@/lib/services/auth";

export const getSearch = async (term: string) => {
  let userId;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    userId = null;
  }

  let query = supabase
    .from("stream")
    .select("user:users(*), id, title, isLive, thumbnail, updatedAt")
    .order("isLive", { ascending: false })
    .order("updatedAt", { ascending: false });

  if (userId) {
    query = query.not("user.id", "eq", userId);
  }

  if (term) {
    query = query.or(`title.ilike.%${term}%,user.username.ilike.%${term}%`);
  }

  const { data: streams, error } = await query;

  if (error) {
    throw new Error("Error fetching streams");
  }

  return streams;
};
