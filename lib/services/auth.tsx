import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const getSelf = async () => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const { data: user, error } = await supabase
    .from("User")
    .select("*")
    .eq("user_id", self.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Not found");
    }
    throw new Error(error.message);
  }

  return user;
};

export const getSelfByUsername = async (username: string) => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const { data: user, error } = await supabase
    .from("User")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("User not found");
    }
    throw new Error(error.message);
  }

  if (self.username !== user.username) {
    throw new Error("Unauthorized");
  }

  return user;
};
