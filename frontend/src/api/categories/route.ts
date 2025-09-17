import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
  // simulate latency for shimmer
  await new Promise((r) => setTimeout(r, 500));

  const data = [
    { id: 1,  name: "Vegetables", imageUrl: "/assets/images/category/01.png", href: "/shop?cat=veg" },
    { id: 2,  name: "Fruits",     imageUrl: "/assets/images/category/02.png", href: "/shop?cat=fruit" },
    { id: 3,  name: "Bakery",     imageUrl: "/assets/images/category/03.png", href: "/shop?cat=bakery" },
    { id: 4,  name: "Dairy",      imageUrl: "/assets/images/category/04.png", href: "/shop?cat=dairy" },
    { id: 5,  name: "Beverages",  imageUrl: "/assets/images/category/05.png", href: "/shop?cat=beverage" },
    { id: 6,  name: "Snacks",     imageUrl: "/assets/images/category/06.png", href: "/shop?cat=snack" },
    { id: 7,  name: "Meat",       imageUrl: "/assets/images/category/07.png", href: "/shop?cat=meat" },
    { id: 8,  name: "Seafood",    imageUrl: "/assets/images/category/08.png", href: "/shop?cat=seafood" },
    { id: 9,  name: "Frozen",     imageUrl: "/assets/images/category/09.png", href: "/shop?cat=frozen" },
    { id: 10, name: "Pantry",     imageUrl: "/assets/images/category/10.png", href: "/shop?cat=pantry" },
  ];

  return NextResponse.json(data);
}
