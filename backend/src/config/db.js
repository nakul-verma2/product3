const mongoose = require('mongoose');

async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

module.exports = { connectDb };
