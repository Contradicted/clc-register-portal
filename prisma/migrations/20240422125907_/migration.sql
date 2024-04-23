/*
  Warnings:

  - You are about to drop the column `DOB` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `address_line_1` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `address_line_2` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `home_telephone_no` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "DOB",
DROP COLUMN "address_line_1",
DROP COLUMN "address_line_2",
DROP COLUMN "home_telephone_no",
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "homeTelephoneNo" TEXT;
