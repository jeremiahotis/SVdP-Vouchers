"use client";

import { useEffect, useState } from "react";
import { apiFetch, isRefusal, isError } from "../lib/api-client";

type MeResponse = {
  tenant_id: string | null;
  host: string | null;
};

export default function HomePage() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    let mounted = true;

    apiFetch<MeResponse>("/api/me")
      .then((res) => {
        if (!mounted) {
          return;
        }

        if (isRefusal(res)) {
          setMessage(`Refusal: ${res.reason}`);
          return;
        }

        if (isError(res)) {
          setMessage(`Error: ${res.error.code}`);
          return;
        }

        setMessage(`Tenant: ${res.data.tenant_id ?? "none"}`);
      })
      .catch(() => {
        if (mounted) {
          setMessage("Error: request failed");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main>
      <h1>VoucherShyft</h1>
      <p>{message}</p>
    </main>
  );
}
