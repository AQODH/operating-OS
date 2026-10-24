CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction` text NOT NULL,
	`tenant` text NOT NULL,
	`account` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`key` text NOT NULL,
	`description` text NOT NULL,
	`member` text,
	`source` text,
	`reverses` text,
	`actor` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_key` ON `transactions` (`tenant`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_reversal` ON `transactions` (`tenant`,`reverses`);