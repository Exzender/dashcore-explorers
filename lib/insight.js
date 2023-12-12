'use strict';

const axios = require('axios');
const qs = require('querystring');
const bitcore = require('@dashevo/dashcore-lib');

const _ = bitcore.deps._;
const $ = bitcore.util.preconditions;
const Address = bitcore.Address;
const JSUtil = bitcore.util.js;
const Networks = bitcore.Networks;
const Transaction = bitcore.Transaction;
const UnspentOutput = Transaction.UnspentOutput;
const AddressInfo = require('./models/addressinfo');


/**
 * Allows the retrieval of information regarding the state of the blockchain
 * (and broadcasting of transactions) from/to a trusted Insight server.
 * @param {string=} url the url of the Insight server
 * @param {Network=} network whether to use livenet or testnet
 * @constructor
 */
function Insight(url, network) {
  if (!url && !network) {
    return new Insight(Networks.defaultNetwork);
  }
  if (Networks.get(url)) {
    network = Networks.get(url);
    if (network === Networks.livenet) {
      url = 'https://insight.dash.org';
    } else {
      url = 'https://insight.testnet.networks.dash.org:3002';
    }
  }
  JSUtil.defineImmutable(this, {
    url: url,
    network: Networks.get(network) || Networks.defaultNetwork
  });
  this.request = axios;
  return this;
}

/**
 * @callback Insight.GetTransactionCallback
 * @param {Error} err
 * @param {Object} transaction
 */

/**
 * Get transaction by txid
 * @param {string} txid
 * @param {GetTransactionCallback} callback
 */
Insight.prototype.getTransaction = function(txid, callback) {
  $.checkArgument(_.isFunction(callback));
  $.checkArgument(_.isString(txid));
  $.checkArgument(txid.length === 64);

  this.requestGet('/insight-api/tx/' + txid, function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || res);
    }

    return callback(null, body);
  });
};

/**
 * @callback Insight.GetUtxosCallback
 * @param {Error} err
 * @param {Array.UnspentOutput} utxos
 */

/**
 * Retrieve a list of unspent outputs associated with an address or set of addresses
 * @param {Address|string|Array.Address|Array.string} addresses
 * @param {GetUtxosCallback} callback
 */
Insight.prototype.getUtxos = function(addresses, callback) {
  $.checkArgument(_.isFunction(callback));
  if (!_.isArray(addresses)) {
    addresses = [addresses];
  }
  addresses = _.map(addresses, function(address) {
    return new Address(address);
  });

  this.requestPost('/insight-api/addrs/utxo', {
    addrs: _.map(addresses, function(address) {
      return address.toString();
    }).join(',')
  }, function(err, res, unspent) {
    if (err || res.status !== 200) {
      return callback(err || res);
    }
    try {
      unspent = _.map(unspent, UnspentOutput);
    } catch (ex) {
      if (ex instanceof bitcore.errors.InvalidArgument) {
        return callback(ex);
      }
    }

    return callback(null, unspent);
  });
};

/**
 * @callback Insight.BroadcastCallback
 * @param {Error} err
 * @param {string} txid
 */

/**
 * Broadcast a transaction to the bitcoin network
 * @param {transaction|string} transaction
 * @param {BroadcastCallback} callback
 */
Insight.prototype.broadcast = function(transaction, callback) {
  $.checkArgument(JSUtil.isHexa(transaction) || transaction instanceof Transaction);
  $.checkArgument(_.isFunction(callback));
  if (transaction instanceof Transaction) {
    transaction = transaction.serialize();
  }

  this.requestPost('/insight-api/tx/send', {
    rawtx: transaction
  }, function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || res);
    }
    return callback(null, body ? body.txid : null);
  });
};

/**
 * @callback Insight.BroadcastCallback
 * @param {Error} err
 * @param {string} txid
 */

/**
 * Broadcast a transaction to the bitcoin network
 * @param {transaction|string} transaction
 * @param {BroadcastCallback} callback
 */
Insight.prototype.broadcastInstant = function(transaction, callback) {
  $.checkArgument(JSUtil.isHexa(transaction) || transaction instanceof Transaction);
  $.checkArgument(_.isFunction(callback));
  if (transaction instanceof Transaction) {
    transaction = transaction.serialize();
  }

  this.requestPost('/insight-api/tx/sendix', {
    rawtx: transaction
  }, function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || body);
    }
    return callback(null, body ? body.txid : null);
  });
};


/**
 * @callback Insight.AddressCallback
 * @param {Error} err
 * @param {AddressInfo} info
 */

/**
 * Retrieve information about an address
 * @param {Address|string} address
 * @param {AddressCallback} callback
 */
Insight.prototype.address = function(address, callback) {
  $.checkArgument(_.isFunction(callback));
  address = new Address(address);

  this.requestGet('/insight-api/addr/' + address.toString(), function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || body);
    }
    let info;
    try {
      info = AddressInfo.fromInsight(body);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return callback(e);
      }
      throw e;
    }
    return callback(null, info);
  });
};

/**
 * @callback Insight.InfoCallback
 * @param {Error} err
 * @param {NetworkInfo} info
 */

/**
 * Retrieve Network status
 * @param {InfoCallback} callback
 */
Insight.prototype.status = function( callback) {
  $.checkArgument(_.isFunction(callback));

  this.requestGet('/insight-api/status?q=getInfo', function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || body);
    }
    let info;
    try {
      info = body.lastblockhash;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return callback(e);
      }
      throw e;
    }
    return callback(null, info);
  });
};


/**
 * Retrieve last block hash from Network
 * @param { string } hash
 * @param {InfoCallback} callback
 */
Insight.prototype.getBlockByHash = function(hash, callback) {
  $.checkArgument(_.isFunction(callback));

  this.requestGet(`/insight-api/block/${hash}`, function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || body);
    }
    let info;
    try {
      info = body;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return callback(e);
      }
      throw e;
    }
    return callback(null, info);
  });
};

/**
 * Retrieve last block hash from Network
 * @param {InfoCallback} callback
 */
Insight.prototype.getLastBlockHash = function( callback) {
  $.checkArgument(_.isFunction(callback));

  this.requestGet('/insight-api/status?q=getLastBlockHash', function(err, res, body) {
    if (err || res.status !== 200) {
      return callback(err || body);
    }
    let info;
    try {
      info = body;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return callback(e);
      }
      throw e;
    }
    return callback(null, info);
  });
};

/**
 * Internal function to make a post request to the server
 * @param {string} path
 * @param {?} data
 * @param {function} callback
 * @private
 */
Insight.prototype.requestPost = function(path, data, callback) {
  $.checkArgument(_.isString(path));
  $.checkArgument(_.isFunction(callback));
  this.request.post(this.url + path, qs.stringify(data))
  // this.request.post(this.url + path, data, {
  //   headers: {
  //     // 'application/json' is the modern content-type for JSON, but some
  //     // older servers may use 'text/json'.
  //     // See: http://bit.ly/text-json
  //     'content-type': 'text/json'
  //   }})
      .then((res) => callback(null, res, res.data))
      .catch((err) => callback(err));
};

/**
 * Internal function to make a get request with no params to the server
 * @param {string} path
 * @param {function} callback
 * @private
 */
Insight.prototype.requestGet = function(path, callback) {
  $.checkArgument(_.isString(path));
  $.checkArgument(_.isFunction(callback));
  this.request.get(this.url + path)
      .then((res) => callback(null, res, res.data))
      .catch((err) => callback(err));
};

module.exports = Insight;
