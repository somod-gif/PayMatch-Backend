-- Add Nomba virtual account fields required by the sandbox integration
ALTER TABLE "virtual_accounts"
ADD COLUMN "customerId" TEXT,
ADD COLUMN "accountRef" TEXT,
ADD COLUMN "bankAccountNumber" TEXT,
ADD COLUMN "bankAccountName" TEXT,
ADD COLUMN "currency" TEXT,
ADD COLUMN "expectedAmount" DECIMAL(19,2);

-- Backfill existing rows from the legacy columns and related invoice data
UPDATE "virtual_accounts" AS va
SET
  "accountRef" = COALESCE(va."accountRef", va."accountReference"),
  "bankAccountNumber" = COALESCE(va."bankAccountNumber", va."nombaAccountNumber"),
  "bankAccountName" = COALESCE(va."bankAccountName", va."accountName"),
  "currency" = COALESCE(va."currency", 'NGN'),
  "expectedAmount" = COALESCE(va."expectedAmount", i."expectedAmount"),
  "customerId" = COALESCE(va."customerId", i."customerId")
FROM "invoices" AS i
WHERE va."invoiceId" = i."id";

-- Enforce the new required persistence shape
ALTER TABLE "virtual_accounts"
ALTER COLUMN "customerId" SET NOT NULL,
ALTER COLUMN "accountRef" SET NOT NULL,
ALTER COLUMN "bankAccountNumber" SET NOT NULL,
ALTER COLUMN "bankAccountName" SET NOT NULL,
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "expectedAmount" SET NOT NULL;

ALTER TABLE "virtual_accounts"
ADD CONSTRAINT "virtual_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "virtual_accounts_accountRef_key" ON "virtual_accounts"("accountRef");
CREATE UNIQUE INDEX "virtual_accounts_bankAccountNumber_key" ON "virtual_accounts"("bankAccountNumber");