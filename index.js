var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
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

          try {
            var obj = parse(src);
          } catch (err) {
            return cb(err);
          }

          cb(null, obj, src);
        });
      });
    });
  });
}
