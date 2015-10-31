var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
var plist = require('plist');
var parse = require('bplist-parser').parseBuffer;

module.exports = function(fd, cb){
  fromFd(fd, function(err, zip){
    if (err) return cb(err);

    zip.on('entry', function(entry){
      if (!/^Payload\/[^\/]+\/Info.plist$/.test(entry.fileName)) return;

      zip.openReadStream(entry, function(err, file){
        if (err) return cb(err);

        collect(file, function(err, src){
          if (err) return cb(err);

          cb(null, parse(src), src);
        });
      });
    });
  });
}
