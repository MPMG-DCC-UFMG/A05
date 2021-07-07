const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const consign = require("consign");

// Security
const helmet = require('helmet');

module.exports = () => {
  const app = express();
  const port = 7000;

  app.set("port", port);

  app.use(helmet());
  app.disable('x-powered-by');
  
  // DATABASE CONNECTION
  process.conn = require('../db/hive')();

  // MIDDLEWARES
  app.use(bodyParser.json());
  app.use(cors());
  consign({ cwd: "src" })
    .then("services")
    .then("models")
    .then("controllers")
    .then("routes")
    .into(app);

  return app;
};
