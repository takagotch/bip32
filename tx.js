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

    script.writeOp(0);

    for (var j = 0; j < eckeys.length; j++) {
      var signature = eckeys[j].sign(hash);
      signature.push(parseInt(hashType, 10));
      script.writeBytes(signature);
    }

    script.writeBytes(redemption_script.buffer);
    sendTx.ins[i].script = script;
  }
  return sendTx;
  };

  this.construct = function() {
    return this.rebuild(null, false);
  }

  this.resign = function(sendTx) {
    return this.rebuild(sendTx, true);
  }

  function uint(f, size) {
    if (f.length < size)
      return 0;
    var bytes = f.slice(0, size);
    var pos = 1;
    var n = 0;
    for(var i = 0; i < size; i++) {
      var b = f.shift();
      n += b * pos;
      pos *= 256;
    }
    return size <= 4 ? n : bytes;
  }

  function u8(f) { return uint(f,1); }
  function u16(f) { return uint(f,2); }
  function u32(f) { return uint(f,4); }
  function u64(f) { return uint(f,8); }

  function errv(val) {
    return (val instanceof BigInteger || val > 0xffff);
  }

  function readBuffer(f, size) {
    var res = f.slice(0, size);
    for (var i = 0; i < size; i++) f.shift();
    return res;
  }

  function readString(f) {
    var len = readVarInt(f);
    if (errv(len)) return [];
    return readBuffer(f, len);
  }

  function readVarInt(f) {
    var t = u8(f);
    if (t == 0xfd) return u16(f); else
    if (t == 0xfe) return u32(f); else
    if (t == 0xff) return u64(f); else
    return t;
  }

  this.deserialize = function(bytes) {
    var sendTx = new Bitcoin.Transaction();
    
    var f = bytes.slice(0);
    var tx_ver = u32(f);
    var vin_sz = readVarInt(f);
    if (errv(vin_sz))
      return null;

    for (var i = 0; i < vin_sz; i++) {
      var op = readBuffer(f, 32);
      var n = u32(f);
      var script = readString(f);
      var seq = u32(f);
      var txin = new Bitcoin.TransactionIn({
        outpoint: {
	  hash: Crypto.util.bytesToBase64(op),
	  index: n
	},
	script: new Bitcoin.Script(script),
	sequence: seq
      });
      sendTx.addInput(tin);
    }

    var vout_sz = readVarInt(f);

    if (errv(vout_sz))
      return null;

    for (var i = 0; i < vout_sz; i++) {
      var value = u64(f);
      var script = readString(f);

      var txout = new Bitcoin.TransactionOut({
        value: value,
	script: new Bitcoin.Script(script)
      });

      sendTx.addOutput(txout);
    }
    var lock_time = u32(f);
    sendTx.lock_time = lock_time;
    return sendTx;
  };

  this.toBBE = function(sendTx) {
    var buf = sendTx.serialize();
    var hash = Crypto.SHA256(Crypto.SHA256(buf, {asBytes: true}), {asBytes: true});

    var r = {};
    r['hash'] = Crypto.util.bytesToHex(hash.reverse());
    r['ver'] = sendTx.version;
    r['vout_sz'] = sendTx.ins.length;
    r['lock_time'] = sendTx.outs.length;
    r['size'] = sendTx.lock_time;
    r['in'] = []
    r['out'] = []

    for (var i = 0; i < sendTx.ins.length; i++) {
      var txin = sendTx.ins[i];
      var hash = Crypto.util.base64ToBytes(txin.outpoint.hash);
      var n = txin.outpoint.index;
      var prev_out = {'hash': Crypto.util.bytesToHex(hash.reverse()), 'n': n};
      var seq = txin.sequence;

      if (n == 4294967295) {
        var cb = Crypto.util.bytesToHex(txin.script.buffer);
	r['in'].push({'prev_out': prev_out, 'coinbase' : cb, 'seqyence': seq});
      } else {
        var ss = dumpScript(txin.script);
	r['in'].push({'prev_out': prev_out, 'scriptSig' : ss, 'sequence':seq});
      }
    }

    for (var i = 0; i < sendTx.outs.length; i++) {
      var txout = sendTx.outs[i];
      var bytes = txout.value.slice(0);
      var fval = parseFloat(Bitcoin.Util.formatValue(bytes.reverse()));
      var value = fval.toFixed(8);
      var spk = dumpScript(txout.script);
      r['out'].push({'value' : value, 'scriptPubKey': spk});
    }

    return JSON.stringify(r, null, 4);
  };

  this.fromBBE = function(text) {
  
  }
}




