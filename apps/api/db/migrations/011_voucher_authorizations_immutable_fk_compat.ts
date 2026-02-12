import type { Knex } from "knex";

const FUNCTION_NAME = "enforce_voucher_authorizations_immutable";
const TRIGGER_NAME = "trg_voucher_authorizations_immutable";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("voucher_authorizations");
  if (!hasTable) {
    return;
  }

  await knex.raw(`
    create or replace function ${FUNCTION_NAME}()
    returns trigger
    language plpgsql
    as $$
    begin
      -- Allow FK cleanup path only: partner_agency_id can transition to NULL
      -- when no other authorization snapshot fields are changed.
      if TG_OP = 'UPDATE'
         and OLD.partner_agency_id is not null
         and NEW.partner_agency_id is null
         and (to_jsonb(NEW) - 'partner_agency_id') = (to_jsonb(OLD) - 'partner_agency_id') then
        return NEW;
      end if;

      raise exception 'voucher_authorizations rows are immutable';
    end;
    $$;
  `);

  await knex.raw(`
    drop trigger if exists ${TRIGGER_NAME} on voucher_authorizations;
    create trigger ${TRIGGER_NAME}
    before update or delete on voucher_authorizations
    for each row execute function ${FUNCTION_NAME}();
  `);
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("voucher_authorizations");
  if (!hasTable) {
    return;
  }

  await knex.raw(`
    create or replace function ${FUNCTION_NAME}()
    returns trigger
    language plpgsql
    as $$
    begin
      raise exception 'voucher_authorizations rows are immutable';
    end;
    $$;
  `);

  await knex.raw(`
    drop trigger if exists ${TRIGGER_NAME} on voucher_authorizations;
    create trigger ${TRIGGER_NAME}
    before update or delete on voucher_authorizations
    for each row execute function ${FUNCTION_NAME}();
  `);
}
