var fs = require('fs');
var extract = require('..');

var ipa = process.argv[2];
var fd = fs.openSync(ipa, 'r');

extract(fd, function(err, info, raw){
  if (err) throw err;
  console.log(info);
});
