-- Add settlementDetails column to deposit table
ALTER TABLE `deposit` ADD COLUMN `settlementDetails` JSON NULL;