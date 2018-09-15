const promisify = require('util').promisify;
const fromFd = promisify(require('yauzl').fromFd);
const collect = promisify(require('collect-stream'));
const bplistParse = require('bplist-parser').parseBuffer;
const plistParse = require('plist').parse;

const chrOpenChevron = 60;
const chrLowercaseB = 98;
const reg = {
  info: /^Payload\/[^\/]+\.app\/Info.plist$/,
  mobileprovision: /^Payload\/[^\/]+\.app\/embedded.mobileprovision$/
}

module.exports = async function (fd) {
  const zip = await fromFd(fd);
  zip.openReadStreamAsync = promisify(zip.openReadStream.bind(zip))
  zip.on('error', (err) => {
    throw err;
  });

  const work = [];
  work.push(handleEntry(zip, reg.info.test.bind(reg.info), function onFound (src) {
    let plist
    if (src[0] === chrOpenChevron) {
      plist = plistParse(src.toString());
    } else if (src[0] === chrLowercaseB) {
      plist = bplistParse(src);
    } else {
      throw new Error(`unknown plist type byte (0x${src[0].toString(16)})`);
    }
    return plist
  }));
  work.push(handleEntry(zip, reg.mobileprovision.test.bind(reg.mobileprovision), function onFound (src) {
    return src;
  }));

  const [info, mobileprovision] = await Promise.all(work);
  return {
    info,
    mobileprovision
  };
}

function handleEntry (zip, match, onFound, removeListenerOnFound = true) {
  return new Promise((resolve, reject) => {
    let found = false;
    let onentry;
    zip
      .on('entry', onentry = async (entry) => {
        try {
          if (!match(entry.fileName)) { return; }
          found = true
          if (removeListenerOnFound) {
            zip.removeListener('entry', onentry);
          }
          const file = await zip.openReadStreamAsync(entry);
          const src = await collect(file);
          return resolve(onFound(src));
        } catch (err) {
          return reject(err);
        }
      })
      .on('end', () => {
        if (!found) { return resolve(null); }
      });
  });
}