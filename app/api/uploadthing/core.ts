import { createUploadthing, type FileRouter } from "uploadthing/next";

import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const self = await getSelf();

      if (!self) {
        throw new Error("Unauthorized");
      }

      return { user: self };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.stream.update({
          where: {
            userId: metadata.user.id,
          },
          data: {
            thumbnail: file.url,
          },
        });

        return { fileUrl: file.url };
      } catch (error) {
        console.error("Error updating thumbnail:", error);
        throw new Error("Failed to update thumbnail");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
