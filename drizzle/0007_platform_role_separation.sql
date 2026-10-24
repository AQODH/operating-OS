CREATE TABLE `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_roles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created` text NOT NULL,
	CONSTRAINT "platform_role_valid" CHECK("platform_roles"."role" = 'platform_admin')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_role_email` ON `platform_roles` (`email`);--> statement-breakpoint
CREATE TRIGGER platform_audit_no_update BEFORE UPDATE ON platform_audit BEGIN SELECT RAISE(ABORT,'Platform audit is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER platform_audit_no_delete BEFORE DELETE ON platform_audit BEGIN SELECT RAISE(ABORT,'Platform audit is immutable'); END;
