var zip = require('zipjs-browserify');
var typedToBuffer = require('typedarray-to-buffer');
var parse = require('bplist-parser').parseBuffer;

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
          cb(null, parse(buf), buf);
        });
      });
    });
  }, onerror);
};

function findEntry(entries){
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (/^Payload\/[^\/]+\/Info.plist$/.test(entry.filename)) return entry;
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

