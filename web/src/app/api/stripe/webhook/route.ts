import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // TODO: implement Stripe webhook handler
  console.log("Stripe webhook received", body.length);

  return NextResponse.json({ received: true });
}
