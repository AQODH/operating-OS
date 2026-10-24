CREATE TABLE `meeting_transactions` (
	`transaction` text PRIMARY KEY NOT NULL,
	`meeting` text NOT NULL,
	`tenant` text NOT NULL,
	FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meeting`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `meeting_transactions_tenant_meeting` ON `meeting_transactions` (`tenant`,`meeting`);--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN tier integer NOT NULL DEFAULT 1 CONSTRAINT organization_one_tier CHECK(tier IN (1,2,3));
--> statement-breakpoint
CREATE TRIGGER meeting_transaction_tenant BEFORE INSERT ON meeting_transactions BEGIN SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM transactions t JOIN records r ON r.id=NEW.meeting WHERE t.id=NEW."transaction" AND t.tenant=NEW.tenant AND r.tenant=NEW.tenant AND r.kind='meeting') THEN RAISE(ABORT,'Meeting and transaction must belong to the same organization') END; END;
