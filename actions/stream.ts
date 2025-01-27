import { supabase } from '@/lib/services/init';
import { getSelf } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache'; 
import { Stream } from '@/types';

export const updateStream = async (values: Partial<Stream>) => {
  try {
    const self = await getSelf();
    if (!self) {
      throw new Error("Unable to fetch the current user");
    }

    const { data: selfStream, error: streamError } = await supabase
      .from("streams")
      .select("*")
      .eq("userId", self.id)
      .single();

    if (streamError || !selfStream) {
      throw new Error("Stream not found");
    }

    const validData = {
      thumbnail: values.thumbnail,
      title: values.title,
      isChatEnabled: values.isChatEnabled,
      isChatFollowersOnly: values.isChatFollowersOnly,
      isChatDelayed: values.isChatDelayed,
    };

    const { data: updatedStream, error: updateError } = await supabase
      .from("streams")
      .update(validData)
      .eq("id", selfStream.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error("Error updating stream");
    }

    revalidatePath(`/u/${self.username}/chat`);
    revalidatePath(`/u/${self.username}`);
    revalidatePath(`/${self.username}`);

    return updatedStream;
  } catch (error) {
    console.error(error);
    throw new Error("Internal Error");
  }
};
