/**
 *  Helper methods for Totals Panels
 *  Used both in entities/show_script.html & policies/show_script.html
 */

var TotalHelpers = (function() {

  // Private Methods
  // -------------------------

  // Set Total values
  function setTotals(totals, breakdown, columnDef, classSelector, includeFinancialChapters) {
    var format = function(amount) { return columnDef.render(amount, 'display', breakdown); },
        $main = $('#main-total');

    if ( !includeFinancialChapters ) {
      $main.find('#non-financial-total '+classSelector+'-amount').html(format(totals.nonFinancial)).show();
      $main.find('#financial-total '+classSelector+'-amount').html(format(totals.financial)).show();
    }
    $main.find('#total '+classSelector+'-amount').html(format(totals.total));
  }

  // Get Economic totals values
  function getEconomicTotals(breakdown, columnDef) {
    var totals = {
          financial: 0,
          nonFinancial: 0,
          total: 0,
        },
        amount, item;

    for (item in breakdown.sub) {
      amount = columnDef.data(breakdown.sub[item]);
      if ( item[0]==='8' || item[0]==='9' ) {
        totals.financial += amount;
      } else {
        totals.nonFinancial += amount;
      }
    }

    totals.total = totals.financial + totals.nonFinancial;

    return totals;
  }

  // Get Functional totals values
  function getFunctionalTotals(breakdown, columnDef, includeFinancialChapters, financialBreakdown) {
    var totals = {
          financial: 0,
          nonFinancial: 0,
          total: 0,
        },
        getTotal = function(breakdown) { return columnDef.data(breakdown)||0; };
        
    totals.total = getTotal(breakdown);

    if ( !includeFinancialChapters ) {
      totals.financial = getTotal(financialBreakdown);
      totals.total += totals.financial;
      totals.nonFinancial = totals.total - totals.financial;
    }

    return totals;
  }


  // Public Methods
  // -------------------------

  // Set Total Labels
  function setLabels(year, executedLabel, mainLabel, includeFinancialChapters) {
    $('#totals-panel .total-executed-label, #totals-panel .data-label-executed').html(executedLabel);
    $('#totals-year').html(year);
    $('#main-total .main-label').html(mainLabel);

    if ( !includeFinancialChapters ) {
      $('#non-financial-total, #financial-total').show();
    }
  }

  // Set Economic Totals
  function setEconomicTotals(breakdown, columnDef, classSelector, includeFinancialChapters, financialBreakdown) {
    var totals = getEconomicTotals(breakdown, columnDef);
    setTotals(totals, breakdown, columnDef, classSelector, includeFinancialChapters);
  }

  // Set Functional Totals
  function setFunctionalTotals(breakdown, columnDef, classSelector, includeFinancialChapters, financialBreakdown) {
    var totals = getFunctionalTotals(breakdown, columnDef, includeFinancialChapters, financialBreakdown);
    setTotals(totals, breakdown, columnDef, classSelector, includeFinancialChapters);
  }

  // Set Zero Totals when there's no actual data
  function clear(classSelector) {
    $('#main-total '+classSelector+'-amount').html('');
  }


  return {
    setLabels:            setLabels,
    setEconomicTotals:    setEconomicTotals,
    setFunctionalTotals:  setFunctionalTotals,
    clear:                clear,
  };

})();