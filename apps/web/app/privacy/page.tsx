import { Metadata } from "next"
import { DashboardSubheader } from "@workspace/ui/components/dashboard-subheader"
import { ShieldIcon } from "@hugeicons/core-free-icons"

export const metadata: Metadata = {
  title: "Privacy - Awesome Video Prompts",
  description: "Simple privacy information for Awesome Video Prompts users.",
  openGraph: {
    title: "Privacy - Awesome Video Prompts",
    description: "Simple privacy information for Awesome Video Prompts users.",
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Privacy - Awesome Video Prompts",
    description: "Simple privacy information for Awesome Video Prompts users.",
    images: ['/og.png'],
  },
}

export default function PrivacyPage() {
  return (
    <div className="w-full">
      <DashboardSubheader
        title="Privacy"
        description="Simple and transparent privacy practices."
        icon={ShieldIcon}
        iconBoxVariant="primary"
      />
      
      <div className="px-4 py-8">
        <div className="max-w-2xl space-y-8">

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">FAL API Keys</h2>
            <p className="text-muted-foreground">
              Your FAL API keys are stored in your browser. You can check the source code.
            </p>
            <a 
              href="https://github.com/ilkerzg/awesome-video-prompts" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-primary hover:underline"
            >
              View source code →
            </a>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Analytics</h2>
            <p className="text-muted-foreground">
              We use Umami and Google Analytics for anonymous analytics.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Questions?</h2>
            <p className="text-muted-foreground">
              You can reach me on{" "}
              <a 
                href="https://x.com/ailker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Twitter
              </a>
             
            </p>
          </div>
        </div>
        </div> </div>
    </div>
  )
}
