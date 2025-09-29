import HeaderOne from "@/components/header/HeaderOne";
import FeaturedSection from "@/components/product/FeaturedSection";
import BannerSection from "@/components/banner/BannerSection";
import WeeklyBestSelling from "@/components/product/WeeklyBestSelling";
import FooterOne from "@/components/footer/FooterOne";
import {
	getWeeklyBestSellingTabs,
} from "@/lib/api";

import { Suspense } from "react";

async function WeeklyBestSection() {
	const tabs = await getWeeklyBestSellingTabs().catch(() => []);
	return <WeeklyBestSelling tabs={tabs} />;
}

export default async function Home() {
	return (
		<div className="demo-one">
			<HeaderOne />

			<BannerSection />

			<FeaturedSection />

			<Suspense fallback={<WeeklyBestSelling loading />}>
				<WeeklyBestSection />
			</Suspense>

			{/* <TrandingProduct /> */}
			<FooterOne />
		</div>
	);
}
