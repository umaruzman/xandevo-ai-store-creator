import { Capabilities } from '@/components/landing/capabilities';
import { ClosingCta } from '@/components/landing/closing-cta';
import { HowItWorks } from '@/components/landing/how-it-works';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingNav } from '@/components/landing/landing-nav';
import { PromptGallery } from '@/components/landing/prompt-gallery';

export const dynamic = 'force-dynamic'; // nonce CSP requires per-request rendering

export default function HomePage() {
  return (
    <div className="lp min-h-dvh">
      <LandingNav />
      <main>
        <LandingHero />
        <HowItWorks />
        <Capabilities />
        <PromptGallery />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
