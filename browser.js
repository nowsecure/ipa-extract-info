var zip = require('zipjs-browserify');
var typedToBuffer = require('typedarray-to-buffer');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

module.exports = function(blob, cb){
  var onerror = function(err){ cb(err) };
  var blobReader = new zip.BlobReader(blob);
  zip.createReader(blobReader, function(zipReader){
    zipReader.getEntries(function(entries){
      var entry = findEntry(entries);
      if (!entry) return cb(new Error('No Info.plst found'));

      readBlob(entry, function(err, blob){
        if (err) return cb(err);

        blobToTyped(blob, function(err, typed){
          if (err) return cb(err);

          var buf = typedToBuffer(typed);
          var obj;

          if (buf[0] === chrOpenChevron) {
            obj = plistParse(buf.toString());
          } else if (buf[0] === chrLowercaseB) {
            obj = bplistParse(buf);
          } else {
            return cb(new Error('unknown plist type %s', buf[0]));
          }

          cb(null, [].concat(obj), buf);
        });
      });
    });
  }, onerror);
};

function findEntry(entries){
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (reg.plist.test(entry.filename)) return entry;
  }
}

function readBlob(entry, cb){
  var onerror = function(err) { cb(err) };
  var writer = new zip.BlobWriter();

  writer.init(function(){
    entry.getData(writer, function(){
      writer.getData(function(blob){
        cb(null, blob);
      }, onerror);
    });
  }, onerror);
}

function blobToTyped(blob, cb){
  var f = new FileReader;
  f.onload = function(){
    cb(null, f.result);
  };
  f.readAsArrayBuffer(blob);
}

