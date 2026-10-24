CREATE INDEX `audit_tenant_created` ON `audit` (`tenant`,`created`);--> statement-breakpoint
CREATE INDEX `entries_tenant_account` ON `entries` (`tenant`,`account`);--> statement-breakpoint
CREATE INDEX `entries_transaction` ON `entries` (`transaction`);--> statement-breakpoint
CREATE INDEX `records_tenant_kind_created` ON `records` (`tenant`,`kind`,`created`);--> statement-breakpoint
CREATE INDEX `transactions_tenant_created` ON `transactions` (`tenant`,`created`);--> statement-breakpoint
CREATE TRIGGER transaction_tenant_links BEFORE INSERT ON transactions BEGIN
SELECT CASE WHEN NEW.member IS NOT NULL AND NOT EXISTS(SELECT 1 FROM records r WHERE r.id=NEW.member AND r.tenant=NEW.tenant AND r.kind='member') THEN RAISE(ABORT,'Member belongs to another organization or does not exist') END;
SELECT CASE WHEN NEW.source IS NOT NULL AND NOT EXISTS(SELECT 1 FROM records r WHERE r.id=NEW.source AND r.tenant=NEW.tenant) THEN RAISE(ABORT,'Source belongs to another organization or does not exist') END;
SELECT CASE WHEN NEW.reverses IS NOT NULL AND NOT EXISTS(SELECT 1 FROM transactions t WHERE t.id=NEW.reverses AND t.tenant=NEW.tenant AND t.reverses IS NULL) THEN RAISE(ABORT,'Invalid reversal source') END;
END;
