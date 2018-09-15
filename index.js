var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');
var once = require('once');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

const provisioningWatermarks = {
  'enterprise': ['<key>ProvisionsAllDevices</key>'],
  'adhoc': ['<string>iOS Team Ad Hoc Provisioning Profile: *</string>'],
  'developer': ['<string>iOS Team Provisioning Profile: *</string>'],
  'appstore': ['<string>iOS Team Store Provisioning Profile: *</string>', '<key>beta-reports-active</key>']
};

function identifyProvisioningType (entry, zip, cb) {
  if (!reg.mobileProvision.test(entry.fileName)) {
    return false;
  }
  zip.openReadStream(entry, function (err, file) {
    if (err) return cb(err);

    collect(file, function (err, src) {
      if (err) return cb(err);

      try {
        const provisionString = src.toString();
        for (let type of Object.keys(provisioningWatermarks)) {
          for (let watermark of provisioningWatermarks[type]) {
            if (provisionString.indexOf(watermark) !== -1) {
              return cb(null, type);
            }
          }
        }
        return cb(null, null);
      } catch (err) {
        return cb(err);
      }
    });
  });
  return true;
}

module.exports = function (fd, cb) {
  let foundPlist = false;
  let provisioningType = null;
  cb = once(cb || function () {});
  var obj = {};
  var objSrc = null;

  fromFd(fd, function (err, zip) {
    if (err) return cb(err);
    var onentry;

    zip.on('entry', onentry = function (entry) {
      if (identifyProvisioningType(entry, zip, (err, type) => {
        if (err) throw err;
        provisioningType = type;
      })) {
        return;
      }
      if (foundPlist || !reg.infoPlist.test(entry.fileName)) {
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
        if (!foundPlist) {
          return cb(new Error('No Info.plist found'));
        }
        if (provisioningType) {
          obj.provisioningType = provisioningType;
        }
        return cb(null, [].concat(obj), objSrc);
      })
      .on('error', function (err) {
        return cb(err);
      });
  });
};
