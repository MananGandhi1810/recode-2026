// UploadThing file router for chat attachments and images
import { createUploadthing } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  chatAttachment: f({
    image: { maxFileSize: "4MB" },
    text: { maxFileSize: "1MB" },
    video: { maxFileSize: "20MB" },
    application: { maxFileSize: "10MB" },
  })
    .middleware(async ({ req, res }) => ({
      // Add auth or org logic here if needed
      userId: "anon"
    }))
    .onUploadComplete(async ({ file, metadata }) => {
      // Optionally handle post-upload logic
      return { url: file.url };
    }),
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => ({ userId: "anon" }))
    .onUploadComplete(async ({ file }) => ({ url: file.url })),
  workspaceEmoji: f({ image: { maxFileSize: "1MB" } })
    .middleware(async () => ({ userId: "anon" }))
    .onUploadComplete(async ({ file }) => ({ url: file.url })),
};


