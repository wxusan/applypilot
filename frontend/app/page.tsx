import PublicNav from '@/components/landing/PublicNav'
import Hero from '@/components/landing/Hero'
import FeaturesBento from '@/components/landing/FeaturesBento'
import Pricing from '@/components/landing/Pricing'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="font-body text-on-background bg-surface overflow-x-hidden">
      <PublicNav />
      <main className="pt-20">
        <Hero />
        <FeaturesBento />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
