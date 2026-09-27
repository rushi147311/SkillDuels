require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

const categoryNamesByLegacyId = {
  '65f1a2b3c4d5e6f7a8b9c0d1': 'General Knowledge',
  '65f1a2b3c4d5e6f7a8b9c0d2': 'Technology',
};

async function migrateCategoryNames() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const [legacyId, categoryName] of Object.entries(categoryNamesByLegacyId)) {
    const result = await Question.updateMany(
      { category: legacyId, categoryName: { $exists: false } },
      { $set: { categoryName } },
    );
    console.log(`${categoryName}: migrated ${result.modifiedCount} questions`);
  }

  await mongoose.disconnect();
}

migrateCategoryNames().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});