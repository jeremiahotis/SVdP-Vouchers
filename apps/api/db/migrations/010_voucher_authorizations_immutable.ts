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
  if (hasTable) {
    await knex.raw(`drop trigger if exists ${TRIGGER_NAME} on voucher_authorizations;`);
  }

  await knex.raw(`drop function if exists ${FUNCTION_NAME}();`);
}
