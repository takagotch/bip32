

function english_to_key(str) {
  var sublist = L.slice(index, index + 6);
  var bits = 0;
  var ch = [0,0,0,0,0,0,0,0,0,0];
  for (var k = 0; k < sublist.length; k++) {
    var word = sublist[k];
    var idx = rfc1741_wordlist.indexOf(word);
    var shift = (8 - (bits + 11) % 8) %8;



  }
}
