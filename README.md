
# ipa-extract-info

  Extract the Info.plist from an IPA, in node.js and the browser!

## Node

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

## Browser

```js
var extract = require('ipa-extract-info');
var input = document.querySelector('input');

input.addEventListener('change', function(){
  extract(input.files[0], function(err, info, raw){
    if (err) throw err;
    console.log('info', info); // the parsed plist
    console.log('raw', raw);   // the unparsed plist
  });
});
```

## License

  MIT

