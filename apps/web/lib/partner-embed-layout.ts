import type { PartnerFormConfig } from "@voucher-shyft/contracts";

export type PartnerEmbedLayoutSection =
  | { id: "intro_text"; tag: "p"; text: string }
  | {
      id: "voucher_type";
      tag: "select";
      options: string[];
      disabled?: boolean;
      emptyMessage?: string;
    }
  | { id: "rules_list"; tag: "ul"; items: string[] }
  | { id: "name_collection"; tag: "section" };

export type PartnerEmbedLayout = {
  sections: PartnerEmbedLayoutSection[];
};

export function buildPartnerEmbedLayout(config: PartnerFormConfig): PartnerEmbedLayout {
  const sections: PartnerEmbedLayoutSection[] = [];
  const hasVoucherTypes = config.allowed_voucher_types.length > 0;

  if (config.intro_text) {
    sections.push({ id: "intro_text", tag: "p", text: config.intro_text });
  }

  sections.push({
    id: "voucher_type",
    tag: "select",
    options: config.allowed_voucher_types,
    disabled: !hasVoucherTypes,
    emptyMessage: hasVoucherTypes
      ? undefined
      : "No voucher types are configured for this partner.",
  });

  if (config.rules_list.length > 0) {
    sections.push({
      id: "rules_list",
      tag: "ul",
      items: config.rules_list,
    });
  }

  sections.push({ id: "name_collection", tag: "section" });

  return { sections };
}
