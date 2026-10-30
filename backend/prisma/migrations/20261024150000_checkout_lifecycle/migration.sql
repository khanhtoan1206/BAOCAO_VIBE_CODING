ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'WALLET_DEMO';
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Order" ADD COLUMN "refundStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "cancelledBy" INTEGER;
ALTER TABLE "Order" ADD COLUMN "deliveryNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Order" ADD COLUMN "requestHash" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "image" TEXT;
UPDATE "Order" SET "subtotal"="total", "paymentMethod"=CASE WHEN "payment"='COD' THEN 'COD' ELSE 'WALLET_DEMO' END, "paymentStatus"=CASE WHEN "payment"='SIMULATED_PAID' THEN 'DEMO_PAID' ELSE 'UNPAID' END;
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
CREATE TABLE "OrderStatusHistory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "actorId" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OrderStatusHistory_orderId_id_idx" ON "OrderStatusHistory"("orderId", "id");