const fs = require('fs');
const extract = require('..');
const { identifyProvisioningType } = require('../lib/provisioning');
const { promisify } = require('util');

const openAsync = promisify(fs.open);

(async function main () {
  const ipa = process.argv[2];
  const fd = await openAsync(ipa, 'r');
  const result = await extract(fd);
  console.log('Info.plist', result.info);
  console.log('embedded.mobileprovision', result.mobileprovision);
  if (result.mobileprovision !== null) {
    console.log('Provisioning type:', identifyProvisioningType(result.mobileprovision));
  }
})().catch(err => {
  process.exitCode = 1;
  console.error(err.stack);
});
