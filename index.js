var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');
var once = require('once');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

const emp = /^Payload\/[^\/]+\.app\/embedded.mobileprovision$/;

function isEnterprise(entry, zip, cb) {
  if (!emp.test(entry.fileName)) {
    return false;
  }
  zip.openReadStream(entry, function (err, file) {
    if (err) return cb(err);

    collect(file, function (err, src) {
      if (err) return cb(err);

      try {
        cb(null, src.toString().indexOf('<key>ProvisionsAllDevices</key>') !== -1);
      } catch (err) {
        return cb(err);
      }
    });
  });
  return true;
}

module.exports = function (fd, cb) {
  let foundPlist = false;
  let isEnterpriseApp = false;
  cb = once(cb || function () {});
  var obj = null;
  var objSrc = null;

  fromFd(fd, function (err, zip) {
    if (err) return cb(err);
    var onentry;

    zip.on('entry', onentry = function (entry) {
      if (isEnterprise(entry, zip, (err, iea) => {
        isEnterpriseApp = true;
        return;
      })) {
        return;
      };
      if (foundPlist || !reg.test(entry.fileName)) {
          return;
        }
      foundPlist = true;

      zip.removeListener('entry', onentry);
      zip.openReadStream(entry, function (err, file) {
        if (err) return cb(err);

        collect(file, function (err, src) {
          if (err) return cb(err);

          try {
            objSrc = src;
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
        });
      });
    });

    zip
      .on('end', function () {
        if (!foundPlist) { return cb(new Error('No Info.plist found')); }
        obj.isEnterprise = isEnterpriseApp;
        return cb(null, [].concat(obj), objSrc);
      })
      .on('error', function (err) {
        return cb(err);
      });
  });
};
