import { supabase } from "./init";
import { getSelf } from "@/lib/services/auth";

export const isBlockedByUser = async (id: number) => {
  try {
    const self = await getSelf();

    const { data: otherUser, error: userError } = await supabase
      .from("user")
      .select("id")
      .eq("id", id)
      .single();

    if (userError || !otherUser) {
      throw new Error("User not found");
    }

    if (self.id === otherUser.id) {
      return false;
    }

    const { data: existingBlock, error: blockError } = await supabase
      .from("block")
      .select("id")
      .eq("blocker_id", otherUser.id)
      .eq("blocked_id", self.id)
      .single();

    if (blockError) {
      return false;
    }

    return !!existingBlock;
  } catch {
    return false;
  }
};

export const blockUser = async (id: number) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("You cannot block yourself");
  }

  const { data: otherUser, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("id", id)
    .single();

  if (userError || !otherUser) {
    throw new Error("User not found");
  }

  const { data: existingBlock } = await supabase
    .from("block")
    .select("id")
    .eq("blocker_id", self.id)
    .eq("blocked_id", otherUser.id)
    .single();

  if (existingBlock) {
    throw new Error("Already blocked");
  }

  const { data: block, error: blockError } = await supabase
    .from("block")
    .insert({ blocker_id: self.id, blocked_id: otherUser.id })
    .select("*")
    .single();

  if (blockError) {
    throw new Error("Error blocking user");
  }

  return block;
};

export const unblockUser = async (id: number) => {
  const self = await getSelf();

  const { data: otherUser, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("id", id)
    .single();

  if (userError || !otherUser) {
    throw new Error("User not found");
  }

  const { data: existingBlock, error: blockError } = await supabase
    .from("block")
    .select("id")
    .eq("blocker_id", self.id)
    .eq("blocked_id", otherUser.id)
    .single();

  if (blockError || !existingBlock) {
    throw new Error("Not blocked");
  }

  const { data: unblock, error: unblockError } = await supabase
    .from("block")
    .delete()
    .eq("id", existingBlock.id)
    .select("*")
    .single();

  if (unblockError) {
    throw new Error("Error unblocking user");
  }

  return unblock;
};

export const getBlockedUsers = async () => {
  const self = await getSelf();

  const { data: blockedUsers, error } = await supabase
    .from("block")
    .select("*, blocked:users(*)")
    .eq("blocker_id", self.id);

  if (error) {
    throw new Error("Error fetching blocked users");
  }

  return blockedUsers;
};
