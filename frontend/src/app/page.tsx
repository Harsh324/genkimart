import HeaderOne from "@/components/header/HeaderOne";
import FeatureProduct from "@/components/product/FeatureProduct";
import WeeklyBestSelling from "@/components/product/WeeklyBestSelling";
import FooterOne from "@/components/footer/FooterOne";
import BannerMain from "@/components/banner/BannerMain";
import {
	getBanners,
	getCategories,
	getFeaturedProducts,
	getWeeklyBestSellingTabs,
} from "@/lib/api";
import { Suspense } from "react";

// --- Banner (server) ---
async function BannerSection() {
	const [banners, categories] = await Promise.all([
		getBanners().catch(() => []),
		getCategories().catch(() => []),
	]);
	return <BannerMain banners={banners} categories={categories} />;
}

// --- Featured products (server) ---
async function FeaturedSection() {
	const products = await getFeaturedProducts().catch(() => []);
	return <FeatureProduct products={products} />;
}

// --- Weekly best selling (server) ---
async function WeeklyBestSection() {
	const tabs = await getWeeklyBestSellingTabs().catch(() => []);
	return <WeeklyBestSelling tabs={tabs} />;
}

export default async function Home() {
	return (
		<div className="demo-one">
			<HeaderOne />

			<Suspense fallback={<BannerMain loading />}>
				<BannerSection />
			</Suspense>

			<Suspense fallback={<FeatureProduct loading />}>
				<FeaturedSection />
			</Suspense>

			<Suspense fallback={<WeeklyBestSelling loading />}>
				<WeeklyBestSection />
			</Suspense>

			{/* <TrandingProduct /> */}
			<FooterOne />
		</div>
	);
}
