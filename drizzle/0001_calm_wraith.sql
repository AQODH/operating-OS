CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_email` ON `memberships` (`tenant`,`email`);