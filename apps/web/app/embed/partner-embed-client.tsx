"use client";

import { useEffect, useState } from "react";
import type { PartnerFormConfig } from "@voucher-shyft/contracts";
import { DEFAULT_PARTNER_FORM_CONFIG } from "@voucher-shyft/contracts";
import { apiFetch, isError, isRefusal } from "../../lib/api-client";
import { PartnerEmbedFormFields } from "../../lib/partner-embed-form";

const PARTNER_TOKEN_HEADER = "x-partner-token";

type PartnerEmbedClientProps = {
  token: string;
};

export function PartnerEmbedClient({ token }: PartnerEmbedClientProps) {
  const [config, setConfig] = useState<PartnerFormConfig>(DEFAULT_PARTNER_FORM_CONFIG);
  const [statusText, setStatusText] = useState<string>("Loading form settings...");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setStatusText("Missing token");
      setReady(false);
      return;
    }

    apiFetch<PartnerFormConfig>("/api/v1/partner/form-config", {
      headers: {
        [PARTNER_TOKEN_HEADER]: token,
      },
    })
      .then((response) => {
        if (!mounted) {
          return;
        }

        if (isRefusal(response)) {
          setStatusText(`Refusal: ${response.reason}`);
          setReady(false);
          return;
        }

        if (isError(response)) {
          setStatusText(`Error: ${response.error.code}`);
          setReady(false);
          return;
        }

        setConfig(response.data);
        setStatusText("Ready");
        setReady(true);
      })
      .catch(() => {
        if (mounted) {
          setStatusText("Error: request failed");
          setReady(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <main>
      <h1>Partner Voucher Form</h1>
      <p>{statusText}</p>
      {ready ? <PartnerEmbedFormFields config={config} /> : null}
    </main>
  );
}
