-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "paymentPolicy" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "markupAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "markupIsPercentage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "markupValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentPolicy" TEXT;
