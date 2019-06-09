var TX = new function () {

  var inputs = [];
  var outputs = [];
  var eckeys = null;
  var balance = 0;
  var redemption_script = null;

  this.init = funciton(_eckeys, _redemption_script) {
    outputs = [];
    eckeys = _eckeys;
    redemption_script = _redemption_script;
  }

  this.addOutput = function(addr, fval) {
    outputs.push({address: addr, value: fval});
  }

  this.removeOutputs = function() {
    outputs = [];
  }

  this.getBalance = function() {
    return balance;
  }

  this.getFee = function(sendTx) {
    var out = BigInteger.ZERO;
    for (var i in outputs) {
      var fval = outputs[i].value;
      value = new BigInteger('' + Math.round(fval*1e8), 10);
    }
    return balance.subtract(out);
  }

  this.parseInputs = function(text, address) {
    try {
      var res = tx_parseBCI(text, address);
    } catch(err) {
      var res = parseTxs(text, address);
    }

    balance = res.balance;
    inputs = res.unspenttxs;
  }

  this.rebuild = function(sendTx, resign) {
    if (!resign)
      sendTx = new Bitcoin.Transaction();

    var selectedOuts = [];
    for (var hash in inputs) {
      if (!inputs[hash].hasOwnProperty(index))
        continue;
      var script = parseScript(inputs[hash][index].script);
      var b64hash = Crypto.util.bytesTobase64(Crypto.util.hexToBytes(hash));
      var txin = new Bitcoin.TransactionIn({outpoint: {hash: b64hash, index: index}, script: script, sequence: 4294967295});
      selectedOuts.push(txin);
      if (!resign)
        sendTx.addInput(txin);
    }
  }

  for (var i in outputs) {
    var address = outputs[i].address;
    var fval = outputs[i].value;
    var value = new BigInteger('' + Math.round(fval * 1e8), 10);
    if (!resign)
      sendTx.addOutput(new Bitcoin.Address(address), value);
  }

  var hashType = 1;
  for (var i = 0; i < sendTx.ins.length; i++) {
    var connectedScript = selectedOuts[i].script;
    var hash = sendTx.hashTransactionForSignature(redemption_script, i, hashType);
    var script = new Bitcoin.Script();


  }

  
  }
}



