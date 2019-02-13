/**
 *  Helper methods for Totals Panels
 *  Used both in entities/show_script.html & policies/show_script.html
 */

var InvestmentTotalHelpers = (function() {

  // Private Methods
  // -------------------------

  // Get totals values
  function getTotals(breakdown, columnDef) {
    var totals = {
          total: 0,
        },
        amount, item;

    for (item in breakdown.sub) {
      amount = columnDef.data(breakdown.sub[item]);
      totals.total += amount;
    }

    return totals;
  }


  // Public Methods
  // -------------------------

  // Set labels
  function setHeaderLabels(year, executedLabel) {
    $('#totals-panel .total-executed-label, #totals-panel .data-label-executed').html(executedLabel);
    $('#totals-year').html(year);
  }

  function setBodyLabels(mainLabel, notAttributableLabel) {
    $('#main-total .main-label').html(mainLabel);
    $('#main-total .not-attributable-label').html(notAttributableLabel);
  }

  // Set Zero Totals when there's no actual data
  function clear(classSelector) {
    $('#main-total '+classSelector+'-amount').html('');
  }

  // Set Total values
  function setTotals(breakdown, columnDef, classSelector) {
    var format = function(amount) { return columnDef.render(amount, 'display', breakdown); },
        $main = $('#main-total');

    var totals = getTotals(breakdown, columnDef);
    $main.find('#total '+classSelector+'-amount').html(format(totals.total));
  }


  return {
    setHeaderLabels:      setHeaderLabels,
    setBodyLabels:        setBodyLabels,
    setTotals:            setTotals,
    clear:                clear,
  };

})();