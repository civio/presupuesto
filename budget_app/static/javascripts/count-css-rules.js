function countCSSRules() {
  var results = '',
      log = '';
  if (!document.styleSheets) {
      return;
  }
  for (var i = 0; i < document.styleSheets.length; i++) {
      countSheet(document.styleSheets[i]);
  }
  function countSheet(sheet) {
      var count = 0;
      if (sheet && sheet.cssRules) {
          for (var j = 0, l = sheet.cssRules.length; j < l; j++) {
              if( !sheet.cssRules[j].selectorText ) {
                  continue;
              }
              count += sheet.cssRules[j].selectorText.split(',').length;
          }

          log += '\nFile: ' + (sheet.href ? sheet.href : 'inline <style> tag');
          log += '\nRules: ' + sheet.cssRules.length;
          log += '\nSelectors: ' + count;
          log += '\n--------------------------';
          if (count >= 4096) {
              results += '\n********************************\nWARNING:\n There are ' + count + ' CSS rules in the stylesheet ' + sheet.href + ' - IE will ignore the last ' + (count - 4096) + ' rules!\n';
          }
      }
  }
  console.log(log);
  console.log(results);
}
countCSSRules();