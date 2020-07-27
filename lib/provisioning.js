const provisioningWatermarks = {
  'enterprise': ['<key>ProvisionsAllDevices</key>'],
  'adhoc': ['<string>iOS Team Ad Hoc Provisioning Profile: *</string>'],
  'developer': ['<string>iOS Team Provisioning Profile: *</string>'],
  'appstore': ['<string>iOS Team Store Provisioning Profile: *</string>', '<key>beta-reports-active</key>']
};

module.exports.identifyProvisioningType = function identifyProvisioningType (buf) {
  for (const type of Object.keys(provisioningWatermarks)) {
    for (const watermark of provisioningWatermarks[type]) {
      if (buf.indexOf(watermark) !== -1) {
        return type;
      }
    }
  }
};
