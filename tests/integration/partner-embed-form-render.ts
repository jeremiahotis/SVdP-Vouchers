import assert from "node:assert/strict";
import type { PartnerFormConfig } from "../../packages/contracts/src/constants/partner-form-config";
import { buildPartnerEmbedLayout } from "../../apps/web/lib/partner-embed-layout";

const config: PartnerFormConfig = {
  allowed_voucher_types: ["furniture", "clothing"],
  intro_text: "Welcome partners",
  rules_list: ["Bring ID", "No resale"],
};

const layout = buildPartnerEmbedLayout(config);
const sectionIds = layout.sections.map((section) => section.id);

assert.deepStrictEqual(
  sectionIds,
  ["intro_text", "voucher_type", "rules_list", "name_collection"],
  "layout order should keep intro at top and rules directly above name collection",
);

const introSection = layout.sections.find((section) => section.id === "intro_text");
const rulesSection = layout.sections.find((section) => section.id === "rules_list");
const nameSection = layout.sections.find((section) => section.id === "name_collection");
const voucherTypeSection = layout.sections.find((section) => section.id === "voucher_type");

assert.ok(introSection && introSection.tag === "p", "intro should render using <p>");
assert.ok(rulesSection && rulesSection.tag === "ul", "rules should render using <ul>");
assert.ok(nameSection && nameSection.tag === "section", "name collection section should render");
assert.ok(voucherTypeSection && voucherTypeSection.tag === "select", "voucher type selector should render");

if (voucherTypeSection && voucherTypeSection.id === "voucher_type") {
  assert.deepStrictEqual(
    voucherTypeSection.options,
    ["furniture", "clothing"],
    "only configured voucher types should be rendered",
  );
}

const emptyConfig: PartnerFormConfig = {
  allowed_voucher_types: [],
  intro_text: "",
  rules_list: [],
};
const emptyLayout = buildPartnerEmbedLayout(emptyConfig);
const emptyVoucherSection = emptyLayout.sections.find((section) => section.id === "voucher_type");

assert.ok(
  emptyVoucherSection && emptyVoucherSection.tag === "select",
  "voucher type section should still render when no options are configured",
);
if (emptyVoucherSection && emptyVoucherSection.id === "voucher_type") {
  assert.equal(emptyVoucherSection.disabled, true, "voucher type select should be disabled");
  assert.equal(emptyVoucherSection.options.length, 0, "voucher type options should be empty");
  assert.ok(
    emptyVoucherSection.emptyMessage,
    "voucher type empty state should include a helper message",
  );
}
