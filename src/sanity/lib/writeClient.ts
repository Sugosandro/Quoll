import { createClient } from 'next-sanity'

/**
 * Client con token di scrittura — usare SOLO lato server (API routes).
 * Non importare in componenti client: esporrebbe il token.
 */
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})
