/**
 *  Base class for tax Receipt
 *  Used in tax_receipt/tax_receipt_script.html
 *  Each method can be override in a theme implementation
 */

var TaxReceipt = (function() {

  var that = {},
      breakdown,
      getBreakdownValue;

  that.totalTaxPaid = 0;

  // Tax paid select callback
  // We need to define that before taxes object
  that.getSelectTaxPaid = function(selector, values) {
    return values[$('#select-'+selector).val()];
  };


  // Taxes object
  that.taxes = {
    house: {
      selector: 'house',
      values:   [],
      callback: that.getSelectTaxPaid
    },
    vehicle: {
      selector: 'vehicle',
      values:   [],
      callback: that.getSelectTaxPaid
    },
    vehicleExtra: {
      selector: 'extra-vehicle',
      values:   [],
      callback: that.getSelectTaxPaid
    },
    garbage: {
      selector: 'garbage',
      values:   [],
      callback: that.getSelectTaxPaid
    },
    parking: {
      selector: 'parking',
      values:   [],
      callback: that.getSelectTaxPaid
    },
  };

  // Add status scenarios
  that.addStatus = function(selector, status) {
    // Add status selector click listener
    $('#'+selector).click( function() {
      // Set each status value
      for(var item in status) {
        $('#select-'+item).val(status[item]);
      }
      that.redraw();
      return false;
    });
  };


  // Display amount as expense per capita
  that.calculatePersonalTax = function(value, type, item) {
    if (value === null)
      return null;
    
    if (type === 'filter')
      return value;  // We filter based on the raw data

    var percentage = value / getBreakdownValue(item.root);
    return formatDecimal(percentage * that.totalTaxPaid) + ' €';
  };

  that.formatTaxAmount = function(value) {
    return numeral(value).format( '0,0.00', Math.floor ) + ' €';
  };


  // Redraw Grid method must be override in tax_receipt_script.html template
  that.redrawGrid = function() {};


  // Redraw method to calculate total tax paid & update all taxes values
  that.redraw = function() {
    // Initialize total tax paid to zero
    that.totalTaxPaid = 0;

    var key, tax, taxPaid;

    // Loop through the taxes object
    for(key in that.taxes) {
      tax = that.taxes[key];
      // Get tax amount using its callback
      taxAmount = tax.callback( tax.selector, tax.values );
      // Show formatted tax amount
      $('#select-'+tax.selector+'-tax').html(that.formatTaxAmount(taxAmount));
      // Sum tax amount to total tax paid
      that.totalTaxPaid += taxAmount;
    }

    // Show formatted total tax paid
    $('#tax-amount-paid').html(that.formatTaxAmount(that.totalTaxPaid));
    // XXX: window.location.hash = 'ingresos='+getIncomeInEuros();
  
    // Redraw grid
    that.redrawGrid();
  };


  that.setup = function(_breakdown, _getBreakdownValue) {
    breakdown         = _breakdown;
    getBreakdownValue = _getBreakdownValue;
    // Set redraw listener
    $('.form-user-incomings select, .form-user-incomings input').change(that.redraw);
    that.redraw();
  };


  return that;

})();