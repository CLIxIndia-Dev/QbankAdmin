'use strict';

// Authentication logic
const lib = require('../lib');

module.exports.handler =
  (event, context, callback) =>
    lib.refreshHandler(event, callback);
