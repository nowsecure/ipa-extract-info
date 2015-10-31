
# ipa-extract-info

  Extract the Info.plist from an IPA.

## Example

```js
var fs = require('fs');
var extract = require('ipa-extract-info');

var fd = fs.openSync(__dirname + '/Snapchat.ipa', 'r');

extract(fd, function(err, info, raw){
  if (err) throw err;
  console.log(info); // the parsed plist
  console.log(raw);  // the unparsed plist
});
```

## License

  MIT

