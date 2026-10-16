var zip = require('@zip.js/zip.js');
var typedToBuffer = require('typedarray-to-buffer');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

var zipOptions = { useWebWorkers: false };

module.exports = function(blob, cb){
  var zipReader = new zip.ZipReader(new zip.BlobReader(blob), zipOptions);

  zipReader.getEntries()
    .then(function(entries){
      var entry = findEntry(entries);
      if (!entry) throw new Error('No Info.plst found');
      return entry.getData(new zip.Uint8ArrayWriter(), zipOptions);
    })
    .then(function(typed){
      var buf = typedToBuffer(typed);
      var obj;

      if (buf[0] === chrOpenChevron) {
        obj = plistParse(buf.toString());
      } else if (buf[0] === chrLowercaseB) {
        obj = bplistParse(buf);
      } else {
        throw new Error('unknown plist type ' + buf[0]);
      }

      return { obj: [].concat(obj), buf: buf };
    })
    .then(function(res){
      done(function(){ cb(null, res.obj, res.buf) });
    }, function(err){
      done(function(){ cb(err) });
    });

  function done(fn){
    zipReader.close().then(fn, fn);
  }
};

function findEntry(entries){
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (reg.info.test(entry.filename)) return entry;
  }
}
