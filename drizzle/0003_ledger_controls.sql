CREATE TABLE `seals` (
	`transaction` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TRIGGER guard_valid BEFORE INSERT ON guards WHEN NEW.ok <> 1 BEGIN SELECT RAISE(ABORT,'Record changed; reload and retry'); END;
--> statement-breakpoint
CREATE TRIGGER entry_no_update BEFORE UPDATE ON entries BEGIN SELECT RAISE(ABORT,'Ledger entries are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER entry_no_delete BEFORE DELETE ON entries BEGIN SELECT RAISE(ABORT,'Ledger entries are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER transaction_no_update BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT,'Transactions are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER transaction_no_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT,'Transactions are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER entry_valid BEFORE INSERT ON entries BEGIN
SELECT CASE WHEN typeof(NEW.amount)<>'integer' OR NEW.amount=0 OR ABS(NEW.amount)>9007199254740991 THEN RAISE(ABORT,'Invalid money amount') END;
SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM transactions t WHERE t.id=NEW."transaction" AND t.tenant=NEW.tenant) THEN RAISE(ABORT,'Entry tenant does not match transaction') END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM seals s WHERE s."transaction"=NEW."transaction") THEN RAISE(ABORT,'Posted journal is sealed') END;
END;
--> statement-breakpoint
CREATE TRIGGER seal_valid BEFORE INSERT ON seals BEGIN
SELECT CASE WHEN (SELECT COUNT(*) FROM entries e WHERE e."transaction"=NEW."transaction")<2 OR (SELECT COALESCE(SUM(amount),0) FROM entries e WHERE e."transaction"=NEW."transaction")<>0 THEN RAISE(ABORT,'Journal must balance before posting') END;
END;
--> statement-breakpoint
CREATE TRIGGER seal_no_update BEFORE UPDATE ON seals BEGIN SELECT RAISE(ABORT,'Posted journal is sealed'); END;
--> statement-breakpoint
CREATE TRIGGER seal_no_delete BEFORE DELETE ON seals BEGIN SELECT RAISE(ABORT,'Posted journal is sealed'); END;
--> statement-breakpoint
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit records are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit records are immutable'); END;
