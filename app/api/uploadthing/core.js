import { currentUser } from "@/lib/auth";
import { createUploadthing } from "uploadthing/next"

const f = createUploadthing();

const handleAuth = async () => {
    const user = await currentUser();

    if (!user) throw new Error("Unauthorised")

    return user;
}

export const ourFileRouter = {
    personalPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }})
        .middleware(() => handleAuth())
        .onUploadComplete(() => {})
}