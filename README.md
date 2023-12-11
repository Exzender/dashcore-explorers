# Blockchain APIs for bitcore

[![NPM Package](https://img.shields.io/npm/v/dashcore-explorers.svg?style=flat-square)](https://www.npmjs.com/package/dashcore-explorers)
[![Build Status](https://img.shields.io/travis/exzender/dashcore-explorers.svg?branch=master&style=flat-square)](https://travis-ci.org/exzender/dashcore-explorers)
[![Coverage Status](https://img.shields.io/coveralls/bitpay/bitcore-explorers.svg?style=flat-square)](https://coveralls.io/r/bitpay/bitcore-explorers)

A module for [dashcore](https://github.com/dashpay/dashcore-lib) that implements HTTP requests to different Web APIs to query the state of DASH blockchain.

## Changes

Module updated to use current API version of [Insight](https://insight.dash.org)

**Axios** module used instead of deprecated **Request**.

## Getting started

Be careful! When using this module, the information retrieved from remote servers may be compromised and not reflect the actual state of the blockchain.

```sh
npm install dashcore-explorers
bower install dashcore-explorers
```

At the moment, only Insight is supported, and only getting the UTXOs for an address and broadcasting a transaction.

```javascript
var explorers = require('dashcore-explorers');
var insight = new explorers.Insight();

insight.getUtxos('Dash...', function(err, utxos) {
  if (err) {
    // Handle errors...
  } else {
    // Maybe use the UTXOs to create a transaction
  }
});
```

## License

Code released under [the MIT license](https://github.com/bitpay/bitcore/blob/master/LICENSE).

Copyright 2013-2015 BitPay, Inc. Bitcore is a trademark maintained by BitPay, Inc.

[bitcore]: http://github.com/exzender/dashcore-explorers
