-- Multi-tenancy schema migration for SaaS platform
-- Adds organization support, agents, analytics, error tracking, and billing

-- Organizations table
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`description` text,
	`logo` text,
	`owner_id` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`monthly_usage` integer DEFAULT 0 NOT NULL,
	`monthly_quota` integer DEFAULT 1000 NOT NULL,
	`cost_limit` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Create index for organization lookups
CREATE INDEX `organizations_owner_id_idx` on `organizations`(`owner_id`);
CREATE UNIQUE INDEX `organizations_slug_idx` on `organizations`(`slug`);

-- Organization members table
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Create indexes for membership queries
CREATE INDEX `organization_members_org_id_idx` on `organization_members`(`organization_id`);
CREATE INDEX `organization_members_user_id_idx` on `organization_members`(`user_id`);
CREATE UNIQUE INDEX `organization_members_unique_idx` on `organization_members`(`organization_id`, `user_id`);

-- Alter users table to add unique constraint on email
CREATE UNIQUE INDEX `users_email_idx` on `users`(`email`);

-- Agents table (AI chatbots/agents)
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`avatar` text,
	`system_prompt` text NOT NULL,
	`model` text DEFAULT 'gpt-4-mini' NOT NULL,
	`temperature` real DEFAULT 0.7 NOT NULL,
	`max_tokens` integer DEFAULT 2048 NOT NULL,
	`service` text DEFAULT 'chat' NOT NULL,
	`is_public` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`embed_code` text,
	`webhook_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade
);

-- Create indexes for agent queries
CREATE INDEX `agents_org_id_idx` on `agents`(`organization_id`);
CREATE INDEX `agents_service_idx` on `agents`(`service`);

-- Alter chats table to add organization and agent context
ALTER TABLE `chats` ADD COLUMN `organization_id` text NOT NULL DEFAULT '';
ALTER TABLE `chats` ADD COLUMN `agent_id` text;
ALTER TABLE `chats` ADD COLUMN `channel` text DEFAULT 'web';

-- Add foreign keys for chats
CREATE INDEX `chats_org_id_idx` on `chats`(`organization_id`);
CREATE INDEX `chats_agent_id_idx` on `chats`(`agent_id`);

-- API Keys table
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL UNIQUE,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_used_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade
);

-- Create indexes for API key lookups
CREATE INDEX `api_keys_org_id_idx` on `api_keys`(`organization_id`);

-- Agent Integrations table (Mobiwave, M-Pesa, etc)
CREATE TABLE `agent_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE cascade
);

-- Create indexes for integration queries
CREATE INDEX `agent_integrations_agent_id_idx` on `agent_integrations`(`agent_id`);

-- Analytics table
CREATE TABLE `analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`agent_id` text,
	`date` integer NOT NULL,
	`channel` text NOT NULL,
	`total_chats` integer DEFAULT 0 NOT NULL,
	`total_messages` integer DEFAULT 0 NOT NULL,
	`total_users` integer DEFAULT 0 NOT NULL,
	`cost_usd` real DEFAULT 0 NOT NULL,
	`avg_response_time` real DEFAULT 0 NOT NULL,
	`success_rate` real DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE cascade
);

-- Create indexes for analytics queries
CREATE INDEX `analytics_org_id_idx` on `analytics`(`organization_id`);
CREATE INDEX `analytics_agent_id_idx` on `analytics`(`agent_id`);
CREATE INDEX `analytics_date_idx` on `analytics`(`date`);
CREATE INDEX `analytics_channel_idx` on `analytics`(`channel`);

-- Error Logs table
CREATE TABLE `error_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`agent_id` text,
	`chat_id` text,
	`error_type` text NOT NULL,
	`message` text NOT NULL,
	`stack_trace` text,
	`metadata` text,
	`severity` text DEFAULT 'medium' NOT NULL,
	`is_resolved` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE cascade,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE cascade
);

-- Create indexes for error log queries
CREATE INDEX `error_logs_org_id_idx` on `error_logs`(`organization_id`);
CREATE INDEX `error_logs_agent_id_idx` on `error_logs`(`agent_id`);
CREATE INDEX `error_logs_severity_idx` on `error_logs`(`severity`);
CREATE INDEX `error_logs_created_at_idx` on `error_logs`(`created_at`);

-- Subscriptions table
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`mpesa_transaction_id` text,
	`billing_cycle_start` integer NOT NULL,
	`billing_cycle_end` integer NOT NULL,
	`amount` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade
);

-- Create indexes for subscription queries
CREATE INDEX `subscriptions_org_id_idx` on `subscriptions`(`organization_id`);
CREATE INDEX `subscriptions_status_idx` on `subscriptions`(`status`);
