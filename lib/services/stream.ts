import { supabase } from "./init";

export const getStreamByUserId = async (userId: string) => {
  const { data: stream, error } = await supabase
    .from("stream")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error("Error fetching stream by user ID");
  }

  return stream;
};
