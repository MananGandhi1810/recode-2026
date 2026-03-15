import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

// We'll use a basic middleware without strict auth for the prototype avatar upload, 
// but in production, we should verify the user session.
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // In a real app, verify the session here
      return {  };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { url: file.url };
    }),
    
  chatAttachment: f({ image: { maxFileSize: "16MB" }, pdf: { maxFileSize: "16MB" } })
    .middleware(async ({ req }) => {
      return { };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  workspaceEmoji: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      return { };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
};
