import { getSavedApplicationByUserID } from "@/data/application";
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    const application = await getSavedApplicationByUserID(user.id);

    if (application) {
      return NextResponse.json(application, { status: 200 });
    }
    
    return new NextResponse(null)
    
  } catch (error) {
    console.log("[FORM_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: JSON.parse(error.response.text) })
    );
  }
}
