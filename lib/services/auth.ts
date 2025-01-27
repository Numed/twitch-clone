import { supabase } from "./init";
import { currentUser } from "@clerk/nextjs/server";

export const getSelf = async () => {
  const self = await currentUser();

  if (!self || !self.username) {
    throw new Error("Unauthorized");
  }

  const { data: user, error } = await supabase
    .from("user")
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
    .from("user")
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
