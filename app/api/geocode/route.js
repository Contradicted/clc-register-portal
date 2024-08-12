import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q,
          format: "json",
          addressdetails: 1,
          limit: 1,
        },
        headers: {
          "User-Agent": "CLC-Admissions/1.0", // Replace with your app name and version
        },
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error geocoding address:", error);
    return NextResponse.json(
      { error: "Error geocoding address" },
      { status: 500 }
    );
  }
}
