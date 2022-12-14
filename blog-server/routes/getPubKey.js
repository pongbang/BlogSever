const express = require('express');
const { getPublicKey } = require('../core/rsaControl')
const router = express.Router();
const Key = require('../models/Key');
const assert = require('http-assert');

router.get('/', async function (req, res, next) {
  let result = await Key.findOne()
  res.send(200, {
    message: 'ok',
    data: {
      pubKey: result.content
    }
  })
});

module.exports = router;
