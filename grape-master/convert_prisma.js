const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "mongodb"');
schema = schema.replace(/id\s+String\s+@id\s+@default\(cuid\(\)\)/g, 'id String @id @default(auto()) @map("_id") @db.ObjectId');

const relationFields = [
  'userId', 'farmerId', 'listingId', 'brokerId', 'offerId', 'purchaseId',
  'sellerId', 'productId', 'inventoryId', 'brokerInventoryId', 'orderId',
  'buyerId', 'shippingAddressId'
];

for (const field of relationFields) {
  const regex = new RegExp('^(\\s+)' + field + '(\\s+String\\??)(?!.*?@db\\.ObjectId)', 'gm');
  schema = schema.replace(regex, '$1' + field + '$2 @db.ObjectId');
}

fs.writeFileSync('backend/prisma/schema.prisma', schema);
console.log('Schema updated successfully');
