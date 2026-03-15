import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { ourFileRouter } from "./uploadthingServer";

export const UploadButton = generateUploadButton(ourFileRouter);
export const UploadDropzone = generateUploadDropzone(ourFileRouter);
