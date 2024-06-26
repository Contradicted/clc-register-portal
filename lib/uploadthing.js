import {
    generateUploadButton,
    generateUploadDropzone,
} from "@uploadthing/react"
import { generateReactHelpers } from "@uploadthing/react/hooks";

export const UploadButton = generateUploadButton();
export const UploadDropzone = generateUploadDropzone();
export const { useUploadThing, uploadFiles } = generateReactHelpers();
