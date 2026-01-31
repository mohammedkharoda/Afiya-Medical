-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);

-- Create verifications table
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);

-- Add foreign keys
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
