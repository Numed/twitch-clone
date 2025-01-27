"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/services/auth";
import { unblockUser } from "@/lib/services/block";

export const onUnblock = async (id: number) => {
  const self = await getSelf();
  const unblockedUser = await unblockUser(id);

  revalidatePath(`/u/${self.username}/community`);
  return unblockedUser;
};
