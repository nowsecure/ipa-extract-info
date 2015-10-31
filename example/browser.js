// Run with
// $ npm run example-browser

var extract = require('../');

var form = document.createElement('form');
var input = document.createElement('input');
input.setAttribute('type', 'file');
form.appendChild(input);
document.body.appendChild(form);

input.addEventListener('change', function(){
  extract(input.files[0], function(err, obj, raw){
    if (err) throw err;
    console.log('obj', obj);
    console.log('raw', raw);
  });
});

