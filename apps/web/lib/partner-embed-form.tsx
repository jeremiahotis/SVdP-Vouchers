import type { PartnerFormConfig } from "@voucher-shyft/contracts";
import { buildPartnerEmbedLayout } from "./partner-embed-layout";

type PartnerEmbedFormFieldsProps = {
  config: PartnerFormConfig;
};

export function PartnerEmbedFormFields({ config }: PartnerEmbedFormFieldsProps) {
  const layout = buildPartnerEmbedLayout(config);

  return (
    <form>
      {layout.sections.map((section) => {
        if (section.id === "intro_text") {
          return (
            <p key={section.id} data-section="intro-text">
              {section.text}
            </p>
          );
        }

        if (section.id === "voucher_type") {
          const isDisabled = Boolean(section.disabled) || section.options.length === 0;
          return (
            <div key={section.id}>
              <label htmlFor="voucher_type">Voucher Type</label>
              {isDisabled && section.emptyMessage ? (
                <p data-section="voucher-type-empty">{section.emptyMessage}</p>
              ) : null}
              <select
                id="voucher_type"
                name="voucher_type"
                required={!isDisabled}
                disabled={isDisabled}
              >
                {isDisabled ? (
                  <option value="">No voucher types available</option>
                ) : (
                  section.options.map((voucherType) => (
                    <option key={voucherType} value={voucherType}>
                      {voucherType}
                    </option>
                  ))
                )}
              </select>
            </div>
          );
        }

        if (section.id === "rules_list") {
          return (
            <ul key={section.id} data-section="rules-list">
              {section.items.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          );
        }

        return (
          <section key={section.id} data-section="name-collection">
            <label htmlFor="applicant_name">Full Name</label>
            <input id="applicant_name" name="applicant_name" type="text" required />
          </section>
        );
      })}
    </form>
  );
}
