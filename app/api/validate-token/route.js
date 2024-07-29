import { auth } from "@/auth";
import { getUpdateApplicationTokenByToken } from "@/data/update-application-token";
import { formatDateTime } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required!" }, { status: 400 });
  }

  try {
    const tokenDetails = await getUpdateApplicationTokenByToken(token);

    if (tokenDetails && new Date(tokenDetails.expires) > new Date()) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ error: "Token has expired!", valid: false });
    }
  } catch (error) {
    console.error("[DB_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
