-- AlterDefaults: Change currency defaults from SAR to EGP and timezone to Africa/Cairo
ALTER TABLE "Company" ALTER COLUMN "currency" SET DEFAULT 'EGP';
ALTER TABLE "Company" ALTER COLUMN "timezone" SET DEFAULT 'Africa/Cairo';
ALTER TABLE "SalaryProfile" ALTER COLUMN "currency" SET DEFAULT 'EGP';
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'EGP';
