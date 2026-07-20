/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paystackRef` on the `Booking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Booking_paystackRef_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "amountPaid",
DROP COLUMN "currency",
DROP COLUMN "paidAt",
DROP COLUMN "paymentStatus",
DROP COLUMN "paystackRef",
ALTER COLUMN "status" SET DEFAULT 'Pending';
