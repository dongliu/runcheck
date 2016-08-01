/*
delete '' or ' '
rename key
delete non-number characters(unit) in number field
*/
function fieldFixed(datalist,dataSchema,fieldList) {
  datalist.forEach(function(x) {
    fieldList.forEach(function(n) {
      if (x[n[1]] !== undefined) {
        // delete '' or ' '
        if ( x[n[1]].length === 0 || !x[n[1]].replace(/\s/g, '').length) {
          delete x[n[1]];
          return
        }
        // rename key
        x[n[0]] = x[n[1]];
        delete x[n[1]];
        // delete non-number characters(unit) in number field
        if (dataSchema.paths[n[0]].instance === 'Number') {
          x[n[0]] = x[n[0]].replace(/[^\+\-0-9\.]+/g, '');
        }
      }
    })
  });
}

/*function deleteRow(worksheet, r) {
  var re = new RegExp('[A-Z]+' + r +'\\b');
  for (z in worksheet) {
    if(re.test(z)) {
      delete worksheet[z];
    }
  }
  return worksheet;
}*/

// jast max column < Z is avilable
// cut two parts, col will be deleted
/*function cutByColumn(worksheet, col){
  var branch1 = {};
  var branch2 = {};
  for (z in worksheet) {
    if(z[0] < col && isNaN(z[1]) === false) { //  second string is a number
      branch1[z] = worksheet[z];
    }else{
      if(z[0] !== col) {
        branch2[z] = worksheet[z];
      }
    }
  }
  var out = {};
  out.branch1 = branch1;
  out.branch2 = branch2;
  return out;
}*/
module.exports = {
  fieldFixed: fieldFixed,
};