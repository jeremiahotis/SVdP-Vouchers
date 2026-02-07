import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("audit_events", (table) => {
        table.text("correlation_id");
        table.index(["correlation_id"], "idx_audit_events__correlation_id");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("audit_events", (table) => {
        table.dropIndex(["correlation_id"], "idx_audit_events__correlation_id");
        table.dropColumn("correlation_id");
    });
}
