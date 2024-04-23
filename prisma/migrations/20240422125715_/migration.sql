/*
  Warnings:

  - You are about to drop the column `addressLine1` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addressLine2` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `homeTelephoneNo` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "addressLine1",
DROP COLUMN "addressLine2",
DROP COLUMN "dateOfBirth",
DROP COLUMN "homeTelephoneNo",
ADD COLUMN     "DOB" TIMESTAMP(3),
ADD COLUMN     "address_line_1" TEXT,
ADD COLUMN     "address_line_2" TEXT,
ADD COLUMN     "home_telephone_no" TEXT;
