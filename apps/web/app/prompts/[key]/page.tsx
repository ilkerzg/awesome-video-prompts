import type { Metadata } from "next";
import { clientDataApi } from "../../../lib/client-data-loader";
import PromptDetailClient from './prompt-detail-client';

type Props = {
  params: Promise<{ key: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key: promptId } = await params
  
  // Use simple metadata during build to avoid fetch issues
  const title = `${promptId} | Awesome Video Prompts`
  const description = "Professional AI video prompt for cinematic video generation with advanced parameters."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: `${title} - Professional AI Video Prompt Generator`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  }
}

export default async function PromptDetailPage({ params }: Props) {
  // params is awaited in generateMetadata, client component uses useParams
  return <PromptDetailClient />
}
