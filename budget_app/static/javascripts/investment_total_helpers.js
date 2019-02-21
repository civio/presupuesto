/**
 *  Helper methods for Totals Panels
 *  Used both in entities/show_script.html & policies/show_script.html
 */

var InvestmentTotalHelpers = (function() {

  // Private Methods
  // -------------------------

  // Get totals values
  function getTotals(breakdown, columnDef) {
    var total = 0, item;
    for (item in breakdown.sub) {
      total += columnDef.data(breakdown.sub[item]);
    }

    return total;
  }


  // Public Methods
  // -------------------------

  // Set labels
  function setHeaderLabels(year, executedLabel) {
    $('#totals-panel .total-executed-label, #totals-panel .data-label-executed').html(executedLabel);
    $('#totals-year').html(year);
  }

  function setBodyLabels(mainLabel, notAttributableLabel, specialInvestmentsLabel) {
    $('#main-total .main-label').html(mainLabel);
    $('#main-total .main-special-label').html(specialInvestmentsLabel);

    $('#main-total .not-attributable-label').html(notAttributableLabel);
    $('#main-total .not-attributable-special-label').html(specialInvestmentsLabel);
  }

  // Set Zero Totals when there's no actual data
  function clear(classSelector) {
    $('#main-total '+classSelector+'-amount').html('');
    $('#main-total '+classSelector+'-special-amount').html('');
  }

  // Set Total values
  function setTotals(breakdown, specialBreakdown, columnDef, classSelector) {
    var format = function(amount) { return columnDef.render['display'](amount, 'display', breakdown); },
        $main = $('#main-total');

    $main.find('#total '+classSelector+'-amount').html(format(getTotals(breakdown, columnDef)));

    $main.find('#total '+classSelector+'-special-amount').html(format(getTotals(specialBreakdown, columnDef)));
  }


  return {
    setHeaderLabels:      setHeaderLabels,
    setBodyLabels:        setBodyLabels,
    setTotals:            setTotals,
    clear:                clear,
  };

})();