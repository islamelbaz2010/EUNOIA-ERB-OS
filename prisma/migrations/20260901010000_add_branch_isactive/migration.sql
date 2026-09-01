-- Add isActive flag to Branch for admin activate/deactivate support
ALTER TABLE "Branch" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
