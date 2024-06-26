import { getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    const userDetails = await getUserById(user.id);

    if (userDetails) {
      return NextResponse.json(userDetails);
    }

    return new NextResponse(null, { status: 403 });
  } catch (error) {
    console.log("[USER_DETAILS_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: JSON.parse(error.response.text) })
    );
  }
}
