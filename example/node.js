var fs = require('fs');
var extract = require('..');

(async function main () {
  const ipa = process.argv[2];
  const fd = fs.openSync(ipa, 'r');
  const result = await extract(fd);
  console.log('Info.plist', result.info)
  console.log('embedded.mobileprovision', result.mobileprovision)
})().catch(err => {
  process.exitCode = 1;
  console.error(err.stack);
});
