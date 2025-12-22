const mongoose = require('mongoose');

const dbConfig = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  },
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/crm_test_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      ssl: true,
      sslValidate: true,
      retryWrites: true,
      retryReads: true,
    }
  }
};

const getDBConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return dbConfig[env] || dbConfig.development;
};

module.exports = {
  getDBConfig,
  dbConfig
};