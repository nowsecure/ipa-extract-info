const promisify = require('util').promisify;
const fromFd = promisify(require('yauzl').fromFd);
const collect = promisify(require('collect-stream'));
const bplistParse = require('bplist-parser').parseBuffer;
const plistParse = require('plist').parse;
const reg = require('./lib/reg');

const chrOpenChevron = 60;
const chrLowercaseB = 98;

module.exports = async function (fd, { autoClose = true } = {}) {
  const zip = await fromFd(fd, { autoClose });
  zip.openReadStreamAsync = promisify(zip.openReadStream.bind(zip));
  zip.on('error', (err) => {
    throw err;
  });

  const findInfo = async () => {
    const matchInfo = f => reg.info.test(f);
    const { entry } = await findEntry(zip, matchInfo);
    if (!entry) {
      return null;
    }
    const file = await zip.openReadStreamAsync(entry);
    const src = await collect(file);

    let parsed;
    if (src[0] === chrOpenChevron) {
      parsed = plistParse(src.toString());
    } else if (src[0] === chrLowercaseB) {
      parsed = bplistParse(src);
    } else {
      throw new Error(`unknown plist type byte (0x${src[0].toString(16)})`);
    }

    return parsed;
  }

  const findProv = async () => {
    const matchProv = f => reg.mobileprovision.test(f);
    const { entry } = await findEntry(zip, matchProv);
    if (!entry) {
      return null;
    }
    const file = await zip.openReadStreamAsync(entry);
    return collect(file);
  };

  const [info, mobileprovision] = await Promise.all([findInfo(), findProv()]);
  return {
    info,
    mobileprovision
  };
};

function findEntry (zip, match) {
  return new Promise((resolve, reject) => {
    let found = false;
    let onentry;
    zip
      .on('entry', onentry = async (entry) => {
        try {
          if (!match(entry.fileName)) { return; }
          found = true;
          zip.removeListener('entry', onentry);
          return resolve({ entry });
        } catch (err) {
          return reject(err);
        }
      })
      .on('end', () => {
        const entry = null;
        if (!found) { return resolve({ entry }); }
      });
  });
}
