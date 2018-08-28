var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');
var once = require('once');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

module.exports = function(fd, cb){
  var foundPlist = false;
  cb = once(cb || function(){});

  fromFd(fd, function(err, zip){
    if (err) return cb(err);
    var onentry;

    zip.on('entry', onentry = function(entry){
      if (!reg.test(entry.fileName)) {
        return
      } else {
        foundPlist = true
      }

      zip.removeListener('entry', onentry);
      zip.openReadStream(entry, function(err, file){
        if (err) return cb(err);

        collect(file, function(err, src){
          if (err) return cb(err);

          var obj;
          try {
            if (src[0] === chrOpenChevron) {
              obj = plistParse(src.toString());
            } else if (src[0] === chrLowercaseB) {
              obj = bplistParse(src);
            } else {
              return cb(new Error('unknown plist type %s', src[0]));
            }
          } catch (err) {
            return cb(err);
          }

          cb(null, [].concat(obj), src);
        });
      });
    });

    zip
    .on('end', function() {
      if (!foundPlist) { return cb(new Error('No Info.plist found')); }
    })
    .on('error', function(err) {
      return cb(err);
    });
  });
}
