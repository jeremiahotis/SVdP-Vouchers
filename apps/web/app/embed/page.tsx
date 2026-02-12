import { PartnerEmbedClient } from "./partner-embed-client";

type EmbedPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

export default async function PartnerEmbedPage({ searchParams }: EmbedPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "");

  return <PartnerEmbedClient token={token.trim()} />;
}
