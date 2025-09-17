import { NextResponse } from "next/server";

export const revalidate = 0; // don't cache; always "fresh"

export async function GET() {
  // simulate latency so shimmer is visible
  await new Promise((r) => setTimeout(r, 700));

  const data = [
    {
      id: 1,
      headline: "Do not miss our amazing grocery deals",
      subtext: "Get up to 30% off on your first $150 purchase",
      ctaText: "Shop Now",
      ctaHref: "/shop",
      imageKey: "bg_one-banner",
    },
    {
      id: 2,
      headline: "Fresh, organic & local—delivered",
      subtext: "Order by 5pm for same-day delivery",
      ctaText: "Explore",
      ctaHref: "/shop?tag=organic",
      imageKey: "bg_one-banner two",
    },
  ];

  return NextResponse.json(data);
}
