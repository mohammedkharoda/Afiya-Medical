CREATE TYPE "public"."InvitationStatus" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "doctor_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"token" text NOT NULL,
	"status" "InvitationStatus" DEFAULT 'PENDING' NOT NULL,
	"invitedBy" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "doctor_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_invitedBy_users_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_invitations_token_idx" ON "doctor_invitations" USING btree ("token");