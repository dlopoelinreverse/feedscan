import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { formId, answers, metadata } = body;

  if (!formId || !answers) {
    return NextResponse.json({ error: "formId and answers are required" }, { status: 400 });
  }

  // TODO: implement response submission with rate limiting
  console.log("Response received for form", formId, metadata);

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");

  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }

  // TODO: implement response fetching
  return NextResponse.json({ responses: [] });
}
