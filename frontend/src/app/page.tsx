import BannerOne from "@/components/banner/BannerOne";
import FeatureOne from "@/components/feature/FeatureOne";
import HeaderOne from "@/components/header/HeaderOne";
import FeatureProduct from "@/components/product/FeatureProduct";
import WeeklyBestSelling from "@/components/product/WeeklyBestSelling";
import TrandingProduct from "@/components/product/TrandingProduct";
import FooterOne from "@/components/footer/FooterOne";
import BannerMain from "@/components/banner/BannerMain";
import { getBanners, getCategories } from "@/lib/api";
import { Suspense } from "react";


async function BannerSection() {
	const [banners, categories] = await Promise.all([
		getBanners().catch(() => []),
		getCategories().catch(() => []),
	]);
	return <BannerMain banners={banners} categories={categories} />;
}

export default async function Home() {
	const [banners, categories] = await Promise.all([
		getBanners().catch(() => []),
		getCategories().catch(() => []),
	]);

	return (
		<div className="demo-one">
			<HeaderOne />
			<Suspense fallback={<BannerMain loading />}>
				<BannerSection />
			</Suspense>
			<FeatureOne />
			<FeatureProduct />
			<WeeklyBestSelling />
			<TrandingProduct />
			<FooterOne />
		</div>
	);
}
