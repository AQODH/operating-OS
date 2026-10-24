import {sql} from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core';
export const organizations = sqliteTable('organizations', { id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(), created: text('created').notNull(),tier:integer('tier').notNull().default(1) },t=>[check('organization_one_tier',sql`${t.tier} IN (1,2,3)`)]);
export const records = sqliteTable('records', { id: text('id').primaryKey(), tenant: text('tenant').notNull().references(() => organizations.id), kind: text('kind').notNull(), name: text('name').notNull(), data: text('data').notNull(), version: integer('version').notNull().default(1), created: text('created').notNull() }, t => [index('records_tenant_kind_created').on(t.tenant, t.kind, t.created)]);
export const transactions = sqliteTable('transactions', { id: text('id').primaryKey(), tenant: text('tenant').notNull().references(() => organizations.id), key: text('key').notNull(), description: text('description').notNull(), member: text('member'), source: text('source'), reverses: text('reverses'), actor: text('actor').notNull(), created: text('created').notNull() }, t => [index('transactions_tenant_created').on(t.tenant, t.created), uniqueIndex('transaction_key').on(t.tenant, t.key), uniqueIndex('one_reversal').on(t.tenant, t.reverses)]);
export const entries = sqliteTable('entries', { id: text('id').primaryKey(), transaction: text('transaction').notNull().references(() => transactions.id), tenant: text('tenant').notNull().references(() => organizations.id), account: text('account').notNull(), amount: integer('amount').notNull() }, t => [index('entries_tenant_account').on(t.tenant, t.account), index('entries_transaction').on(t.transaction)]);
export const audit = sqliteTable('audit', { id: text('id').primaryKey(), tenant: text('tenant').notNull(), actor: text('actor').notNull(), action: text('action').notNull(), target: text('target').notNull(), created: text('created').notNull() }, t => [index('audit_tenant_created').on(t.tenant, t.created)]);
export const memberships = sqliteTable('memberships', { id: text('id').primaryKey(), tenant: text('tenant').notNull().references(() => organizations.id), email: text('email').notNull(), role: text('role').notNull(), created: text('created').notNull() }, t => [uniqueIndex('membership_email').on(t.tenant, t.email)]);
export const guards = sqliteTable('guards', { id: text('id').primaryKey(), ok: integer('ok').notNull() });
export const seals = sqliteTable('seals', { transaction: text('transaction').primaryKey().references(() => transactions.id), created: text('created').notNull() });

export const meetingTransactions=sqliteTable('meeting_transactions',{transaction:text('transaction').primaryKey().references(()=>transactions.id),meeting:text('meeting').notNull().references(()=>records.id),tenant:text('tenant').notNull().references(()=>organizations.id)},t=>[index('meeting_transactions_tenant_meeting').on(t.tenant,t.meeting)]);

export const platformRoles = sqliteTable('platform_roles', {
  userId: text('user_id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  created: text('created').notNull(),
}, t => [uniqueIndex('platform_role_email').on(t.email), check('platform_role_valid', sql`${t.role} = 'platform_admin'`)]);
export const platformAudit = sqliteTable('platform_audit', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  created: text('created').notNull(),
});
