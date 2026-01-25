CREATE TABLE "admin_departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"department_id" varchar NOT NULL,
	"role" varchar(20) DEFAULT 'JUNIOR' NOT NULL,
	"max_concurrent_chats" numeric(3, 0) DEFAULT '5' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"game_type" varchar(30) NOT NULL,
	"game_id" varchar(100),
	"bet_amount" numeric(15, 2) NOT NULL,
	"win_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"profit" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"multiplier" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"server_seed" text,
	"client_seed" text,
	"nonce" numeric(15, 0),
	"server_seed_hash" text,
	"game_payload" text,
	"game_result" text,
	"reserve_transaction_id" varchar,
	"settle_transaction_id" varchar,
	"used_bonus_balance" boolean DEFAULT false,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_bad_words" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" varchar(100) NOT NULL,
	"severity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_bad_words_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"reply_to_id" varchar,
	"reply_to_username" varchar,
	"reply_to_content" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_by" varchar,
	"deleted_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_penalties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"room_id" varchar,
	"penalty_type" varchar(20) NOT NULL,
	"violation_type" varchar(30) NOT NULL,
	"reason" text,
	"message_content" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"issued_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"reporter_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'GLOBAL' NOT NULL,
	"game_type" varchar(30),
	"min_vip_level" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "chat_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "chat_user_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" varchar NOT NULL,
	"blocked_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_user_customization" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name_color" varchar(20),
	"name_effect" varchar(30),
	"message_color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_user_customization_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_user_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_room_id" varchar,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_user_status_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_box_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"level" integer NOT NULL,
	"reward_type" varchar(20) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jackpot_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) DEFAULT 'Global Jackpot' NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '1000.00' NOT NULL,
	"minimum_amount" numeric(15, 2) DEFAULT '1000.00' NOT NULL,
	"contribution_rate" numeric(5, 4) DEFAULT '0.0020' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_won_at" timestamp,
	"last_won_by" varchar,
	"last_won_amount" numeric(15, 2),
	"total_paid_out" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jackpot_contributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bet_id" varchar,
	"game_type" varchar(50) NOT NULL,
	"bet_amount" numeric(15, 2) NOT NULL,
	"contribution" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jackpot_wins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"user_name" varchar(100),
	"amount" numeric(15, 2) NOT NULL,
	"game_type" varchar(50) NOT NULL,
	"game_id" varchar,
	"bet_amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "level_rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" integer NOT NULL,
	"reward_type" varchar(20) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"description" text,
	"xp_required" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "level_rewards_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "level_up_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"from_level" integer NOT NULL,
	"to_level" integer NOT NULL,
	"xp_gained" integer NOT NULL,
	"reward_claimed" boolean DEFAULT false,
	"reward_value" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mines_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bet_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"mine_positions" text NOT NULL,
	"mine_count" numeric(2, 0) NOT NULL,
	"revealed" text DEFAULT '[]' NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mines_games_bet_id_unique" UNIQUE("bet_id")
);
--> statement-breakpoint
CREATE TABLE "mission_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"instance_id" varchar NOT NULL,
	"progress" numeric(15, 2) DEFAULT '0' NOT NULL,
	"target" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"completed_at" timestamp,
	"claimed_at" timestamp,
	"reward_type" varchar(30) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_instances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_progress_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" varchar NOT NULL,
	"source_event" varchar(50) NOT NULL,
	"source_id" varchar(100),
	"progress_delta" numeric(15, 2) NOT NULL,
	"progress_after" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50),
	"cadence" varchar(10) NOT NULL,
	"requirement_type" varchar(30) NOT NULL,
	"requirement_target" numeric(15, 2) NOT NULL,
	"requirement_metadata" text,
	"reward_type" varchar(30) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"reward_metadata" text,
	"min_vip_level" varchar(20) DEFAULT 'bronze',
	"vip_reward_multiplier" numeric(5, 2) DEFAULT '1.00',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"promotions_in_app" boolean DEFAULT true NOT NULL,
	"promotions_push" boolean DEFAULT true NOT NULL,
	"promotions_email" boolean DEFAULT false NOT NULL,
	"bet_results_in_app" boolean DEFAULT true NOT NULL,
	"bet_results_push" boolean DEFAULT true NOT NULL,
	"level_up_in_app" boolean DEFAULT true NOT NULL,
	"level_up_push" boolean DEFAULT true NOT NULL,
	"daily_box_in_app" boolean DEFAULT true NOT NULL,
	"daily_box_push" boolean DEFAULT true NOT NULL,
	"rakeback_in_app" boolean DEFAULT true NOT NULL,
	"rakeback_push" boolean DEFAULT true NOT NULL,
	"deposits_in_app" boolean DEFAULT true NOT NULL,
	"deposits_push" boolean DEFAULT true NOT NULL,
	"withdrawals_in_app" boolean DEFAULT true NOT NULL,
	"withdrawals_push" boolean DEFAULT true NOT NULL,
	"security_in_app" boolean DEFAULT true NOT NULL,
	"security_push" boolean DEFAULT true NOT NULL,
	"security_email" boolean DEFAULT true NOT NULL,
	"missions_in_app" boolean DEFAULT true NOT NULL,
	"missions_push" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"icon" varchar(50),
	"action_url" varchar(500),
	"image_url" varchar(500),
	"priority" varchar(10) DEFAULT 'NORMAL' NOT NULL,
	"target_audience" varchar(30) DEFAULT 'ALL',
	"target_vip_tiers" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "playfivers_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_code" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"provider_id" varchar,
	"provider_name" varchar(100) NOT NULL,
	"is_original" boolean DEFAULT false NOT NULL,
	"supports_free_rounds" boolean DEFAULT false NOT NULL,
	"game_type" varchar(30) DEFAULT 'slot',
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playfivers_games_game_code_unique" UNIQUE("game_code")
);
--> statement-breakpoint
CREATE TABLE "playfivers_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" numeric(15, 0) NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"wallet_name" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playfivers_providers_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "playfivers_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"game_id" varchar,
	"game_code" varchar(100) NOT NULL,
	"provider_name" varchar(100) NOT NULL,
	"launch_url" text NOT NULL,
	"balance_at_start" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playfivers_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_transaction_id" varchar(200) NOT NULL,
	"user_id" varchar NOT NULL,
	"session_id" varchar,
	"transaction_type" varchar(30) NOT NULL,
	"game_code" varchar(100),
	"provider_name" varchar(100),
	"bet_amount" numeric(15, 2) DEFAULT '0.00',
	"win_amount" numeric(15, 2) DEFAULT '0.00',
	"balance_before" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'SUCCESS' NOT NULL,
	"wallet_transaction_id" varchar,
	"raw_payload" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playfivers_transactions_external_transaction_id_unique" UNIQUE("external_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rakeback_payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"transaction_id" varchar,
	"rollover_required" numeric(15, 2) NOT NULL,
	"rollover_completed" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"rollover_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rakeback_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" varchar(10) DEFAULT 'WEEKLY' NOT NULL,
	"vip_tier_at_calculation" varchar(20) NOT NULL,
	"total_wagered" numeric(15, 2) NOT NULL,
	"total_wins" numeric(15, 2) NOT NULL,
	"net_loss" numeric(15, 2) NOT NULL,
	"rakeback_percent" numeric(5, 2) NOT NULL,
	"rakeback_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rakeback_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vip_tier" varchar(20) NOT NULL,
	"percent_loss" numeric(5, 2) NOT NULL,
	"min_loss_threshold" numeric(15, 2) NOT NULL,
	"max_rakeback_percent" numeric(5, 2) NOT NULL,
	"rollover_multiple" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rakeback_settings_vip_tier_unique" UNIQUE("vip_tier")
);
--> statement-breakpoint
CREATE TABLE "responsible_gaming_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action_type" varchar(30) NOT NULL,
	"previous_value" text,
	"new_value" text,
	"reason" text,
	"effective_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"alert_type" varchar(20) NOT NULL,
	"session_duration_minutes" integer NOT NULL,
	"acknowledged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slotsgateway_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_hash" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"image_square" text,
	"image_portrait" text,
	"provider_id" varchar,
	"provider_slug" varchar(100) NOT NULL,
	"game_type" varchar(50) DEFAULT 'video-slots',
	"subcategory" varchar(50),
	"is_mobile" boolean DEFAULT true,
	"is_new" boolean DEFAULT false,
	"has_jackpot" boolean DEFAULT false,
	"supports_free_rounds" boolean DEFAULT false,
	"supports_feature_buy" boolean DEFAULT false,
	"supports_play_for_fun" boolean DEFAULT true,
	"currency" varchar(10) DEFAULT 'BRL',
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slotsgateway_games_id_hash_unique" UNIQUE("id_hash")
);
--> statement-breakpoint
CREATE TABLE "slotsgateway_players" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(100) NOT NULL,
	"currency" varchar(10) DEFAULT 'BRL',
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slotsgateway_players_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "slotsgateway_players_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "slotsgateway_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slotsgateway_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "slotsgateway_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_transaction_id" varchar(200) NOT NULL,
	"user_id" varchar NOT NULL,
	"player_id" varchar,
	"transaction_type" varchar(30) NOT NULL,
	"game_id_hash" varchar(200),
	"round_id" varchar(200),
	"bet_amount" numeric(15, 2) DEFAULT '0.00',
	"win_amount" numeric(15, 2) DEFAULT '0.00',
	"balance_before" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'SUCCESS' NOT NULL,
	"wallet_transaction_id" varchar,
	"raw_payload" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slotsgateway_transactions_external_transaction_id_unique" UNIQUE("external_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "sports_bet_selections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bet_slip_id" varchar NOT NULL,
	"match_id" varchar NOT NULL,
	"odd_id" varchar NOT NULL,
	"market_type" varchar(50) NOT NULL,
	"selection" varchar(100) NOT NULL,
	"selection_name" varchar(200) NOT NULL,
	"odds" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"result" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_bet_slips" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bet_number" varchar(20) NOT NULL,
	"user_id" varchar NOT NULL,
	"bet_type" varchar(20) NOT NULL,
	"total_odds" numeric(15, 2) NOT NULL,
	"stake" numeric(15, 2) NOT NULL,
	"potential_win" numeric(15, 2) NOT NULL,
	"actual_win" numeric(15, 2),
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"used_bonus" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sports_bet_slips_bet_number_unique" UNIQUE("bet_number")
);
--> statement-breakpoint
CREATE TABLE "sports_leagues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"country" varchar(100),
	"country_code" varchar(3),
	"sport" varchar(30) NOT NULL,
	"logo" text,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"external_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" varchar NOT NULL,
	"home_team_id" varchar NOT NULL,
	"away_team_id" varchar NOT NULL,
	"sport" varchar(30) NOT NULL,
	"starts_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"period" varchar(50),
	"minute" integer,
	"is_live" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"stream_url" text,
	"result" varchar(10),
	"external_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_odds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" varchar NOT NULL,
	"market_type" varchar(50) NOT NULL,
	"selection" varchar(100) NOT NULL,
	"selection_name" varchar(200) NOT NULL,
	"odds" numeric(10, 2) NOT NULL,
	"line" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_name" varchar(50),
	"logo" text,
	"country" varchar(100),
	"sport" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"external_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_reward_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"streak_reward_id" varchar NOT NULL,
	"streak_day" integer NOT NULL,
	"reward_type" varchar(30) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"streak_day" integer NOT NULL,
	"reward_type" varchar(30) NOT NULL,
	"reward_value" numeric(15, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streak_rewards_streak_day_unique" UNIQUE("streak_day")
);
--> statement-breakpoint
CREATE TABLE "support_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"admin_id" varchar,
	"user_id" varchar,
	"data_before" text,
	"data_after" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_canned_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(30),
	"shortcut" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" numeric(10, 0) DEFAULT '0' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" varchar NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_id" varchar,
	"message" text NOT NULL,
	"attachments" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chat_transfers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" varchar NOT NULL,
	"from_department_id" varchar,
	"to_department_id" varchar NOT NULL,
	"from_admin_id" varchar,
	"to_admin_id" varchar,
	"transferred_by_admin_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"department_id" varchar,
	"assigned_admin_id" varchar,
	"status" varchar(20) DEFAULT 'WAITING' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"category" varchar(30),
	"tags" text,
	"queue_position" numeric(10, 0),
	"triage_completed" boolean DEFAULT false NOT NULL,
	"triage_response" text,
	"user_rating" numeric(1, 0),
	"user_feedback" text,
	"started_at" timestamp,
	"closed_at" timestamp,
	"closed_by" varchar,
	"close_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority_weight" numeric(5, 0) DEFAULT '1' NOT NULL,
	"working_hours" text,
	"auto_assign" boolean DEFAULT true NOT NULL,
	"max_queue_size" numeric(5, 0) DEFAULT '50' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "support_sla_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"department_id" varchar,
	"priority" varchar(20) NOT NULL,
	"first_response_minutes" numeric(10, 0) NOT NULL,
	"resolution_minutes" numeric(10, 0) NOT NULL,
	"escalate_after_minutes" numeric(10, 0),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_escalations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"from_level" numeric(2, 0) NOT NULL,
	"to_level" numeric(2, 0) NOT NULL,
	"from_admin_id" varchar,
	"to_admin_id" varchar,
	"escalated_by" varchar NOT NULL,
	"reason" text NOT NULL,
	"is_automatic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_id" varchar,
	"message" text NOT NULL,
	"attachments" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(20) NOT NULL,
	"user_id" varchar NOT NULL,
	"department_id" varchar,
	"assigned_admin_id" varchar,
	"from_chat_id" varchar,
	"subject" text NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"category" varchar(30),
	"tags" text,
	"escalation_level" numeric(2, 0) DEFAULT '0' NOT NULL,
	"sla_deadline" timestamp,
	"sla_breached" boolean DEFAULT false NOT NULL,
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"closed_at" timestamp,
	"closed_by" varchar,
	"user_rating" numeric(1, 0),
	"user_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "support_triage_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"keywords" text NOT NULL,
	"category" varchar(30) NOT NULL,
	"department_id" varchar,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"auto_response" text,
	"can_auto_resolve" boolean DEFAULT false NOT NULL,
	"priority_order" numeric(5, 0) DEFAULT '100' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"match_count" numeric(15, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"notification_id" varchar,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"icon" varchar(50),
	"action_url" varchar(500),
	"priority" varchar(10) DEFAULT 'NORMAL' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"delivered_via_push" boolean DEFAULT false,
	"delivered_via_email" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"language" varchar(10) DEFAULT 'pt-BR' NOT NULL,
	"odds_format" varchar(20) DEFAULT 'decimal' NOT NULL,
	"email_marketing" boolean DEFAULT false NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_completion_date" timestamp,
	"streak_protections" integer DEFAULT 0 NOT NULL,
	"total_missions_completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_wagered" numeric(15, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_daily_box_claim" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_deposit_limit" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_deposit_limit" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_deposit_limit" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_bet_limit" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_time_limit" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "self_excluded_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permanent_self_excluded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "self_exclusion_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_session_start" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "chat_moderator_role" varchar(20) DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" text;--> statement-breakpoint
ALTER TABLE "admin_departments" ADD CONSTRAINT "admin_departments_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_departments" ADD CONSTRAINT "admin_departments_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_reserve_transaction_id_transactions_id_fk" FOREIGN KEY ("reserve_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_settle_transaction_id_transactions_id_fk" FOREIGN KEY ("settle_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_penalties" ADD CONSTRAINT "chat_penalties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_penalties" ADD CONSTRAINT "chat_penalties_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_user_blocks" ADD CONSTRAINT "chat_user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_user_blocks" ADD CONSTRAINT "chat_user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_user_customization" ADD CONSTRAINT "chat_user_customization_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_user_status" ADD CONSTRAINT "chat_user_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_box_claims" ADD CONSTRAINT "daily_box_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jackpot_contributions" ADD CONSTRAINT "jackpot_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jackpot_wins" ADD CONSTRAINT "jackpot_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_up_history" ADD CONSTRAINT "level_up_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mines_games" ADD CONSTRAINT "mines_games_bet_id_bets_id_fk" FOREIGN KEY ("bet_id") REFERENCES "public"."bets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mines_games" ADD CONSTRAINT "mines_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_instance_id_mission_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."mission_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_instances" ADD CONSTRAINT "mission_instances_template_id_mission_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."mission_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_progress_logs" ADD CONSTRAINT "mission_progress_logs_assignment_id_mission_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."mission_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_games" ADD CONSTRAINT "playfivers_games_provider_id_playfivers_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."playfivers_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_sessions" ADD CONSTRAINT "playfivers_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_sessions" ADD CONSTRAINT "playfivers_sessions_game_id_playfivers_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."playfivers_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_transactions" ADD CONSTRAINT "playfivers_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_transactions" ADD CONSTRAINT "playfivers_transactions_session_id_playfivers_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."playfivers_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playfivers_transactions" ADD CONSTRAINT "playfivers_transactions_wallet_transaction_id_transactions_id_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rakeback_payouts" ADD CONSTRAINT "rakeback_payouts_period_id_rakeback_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."rakeback_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rakeback_payouts" ADD CONSTRAINT "rakeback_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rakeback_payouts" ADD CONSTRAINT "rakeback_payouts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rakeback_periods" ADD CONSTRAINT "rakeback_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_gaming_logs" ADD CONSTRAINT "responsible_gaming_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_alerts" ADD CONSTRAINT "session_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotsgateway_games" ADD CONSTRAINT "slotsgateway_games_provider_id_slotsgateway_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."slotsgateway_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotsgateway_players" ADD CONSTRAINT "slotsgateway_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotsgateway_transactions" ADD CONSTRAINT "slotsgateway_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotsgateway_transactions" ADD CONSTRAINT "slotsgateway_transactions_player_id_slotsgateway_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."slotsgateway_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotsgateway_transactions" ADD CONSTRAINT "slotsgateway_transactions_wallet_transaction_id_transactions_id_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_bet_selections" ADD CONSTRAINT "sports_bet_selections_bet_slip_id_sports_bet_slips_id_fk" FOREIGN KEY ("bet_slip_id") REFERENCES "public"."sports_bet_slips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_bet_selections" ADD CONSTRAINT "sports_bet_selections_match_id_sports_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."sports_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_bet_selections" ADD CONSTRAINT "sports_bet_selections_odd_id_sports_odds_id_fk" FOREIGN KEY ("odd_id") REFERENCES "public"."sports_odds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_bet_slips" ADD CONSTRAINT "sports_bet_slips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_matches" ADD CONSTRAINT "sports_matches_league_id_sports_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."sports_leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_matches" ADD CONSTRAINT "sports_matches_home_team_id_sports_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."sports_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_matches" ADD CONSTRAINT "sports_matches_away_team_id_sports_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."sports_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_odds" ADD CONSTRAINT "sports_odds_match_id_sports_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."sports_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_reward_claims" ADD CONSTRAINT "streak_reward_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_reward_claims" ADD CONSTRAINT "streak_reward_claims_streak_reward_id_streak_rewards_id_fk" FOREIGN KEY ("streak_reward_id") REFERENCES "public"."streak_rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_audit_logs" ADD CONSTRAINT "support_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_audit_logs" ADD CONSTRAINT "support_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_canned_responses" ADD CONSTRAINT "support_canned_responses_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_canned_responses" ADD CONSTRAINT "support_canned_responses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_messages" ADD CONSTRAINT "support_chat_messages_chat_id_support_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."support_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_messages" ADD CONSTRAINT "support_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_chat_id_support_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."support_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_from_department_id_support_departments_id_fk" FOREIGN KEY ("from_department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_to_department_id_support_departments_id_fk" FOREIGN KEY ("to_department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_from_admin_id_users_id_fk" FOREIGN KEY ("from_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_to_admin_id_users_id_fk" FOREIGN KEY ("to_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_transfers" ADD CONSTRAINT "support_chat_transfers_transferred_by_admin_id_users_id_fk" FOREIGN KEY ("transferred_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_sla_rules" ADD CONSTRAINT "support_sla_rules_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_escalations" ADD CONSTRAINT "support_ticket_escalations_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_escalations" ADD CONSTRAINT "support_ticket_escalations_from_admin_id_users_id_fk" FOREIGN KEY ("from_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_escalations" ADD CONSTRAINT "support_ticket_escalations_to_admin_id_users_id_fk" FOREIGN KEY ("to_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_escalations" ADD CONSTRAINT "support_ticket_escalations_escalated_by_users_id_fk" FOREIGN KEY ("escalated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_from_chat_id_support_chats_id_fk" FOREIGN KEY ("from_chat_id") REFERENCES "public"."support_chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_triage_rules" ADD CONSTRAINT "support_triage_rules_department_id_support_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."support_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;