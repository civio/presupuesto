/**
 *  Base class for tax Receipt
 *  Used in tax_receipt/tax_receipt_script.html
 *  Each method can be override in a theme implementation
 */

var TaxReceipt = (function() {

  var that = {},
      breakdown,
      getBreakdownValue,
      totalTaxPaid = 0;
      
  // Taxes values
  that.houseTax = [];
  that.vehicleTax = [];
  that.vehicleExtraTax = [];
  that.garbageTax = [];
  that.parkingTax = [];


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
    return formatDecimal(percentage * totalTaxPaid) + ' €';
  };

  that.formatTaxAmount = function(value) {
    return numeral(value).format( '0,0.00', Math.floor ) + ' €';
  };

  that.getHouseTaxPaid = function() {
    return that.houseTax[$('#select-house').val()];
  };
  that.getVehicleTaxPaid = function() {
    return that.vehicleTax[$('#select-vehicle').val()];
  };
  that.getExtraVehicleTaxPaid = function() {
    return that.vehicleExtraTax[$('#select-extra-vehicle').val()];
  };
  that.getGarbageTaxPaid = function() {
    return that.garbageTax[$('#select-garbage').val()];
  };
  that.getParkingTaxPaid = function() {
    return that.parkingTax[$('#select-parking').val()];
  };


  // Redraw Grid method must be override in tax_receipt_script.html template
  that.redrawGrid = function() {};


  that.redraw = function() {
    var houseTaxPaid = that.getHouseTaxPaid();
    $('#select-house-tax').text(that.formatTaxAmount(houseTaxPaid));

    var vehicleTaxPaid = that.getVehicleTaxPaid();
    $('#select-vehicle-tax').text(that.formatTaxAmount(vehicleTaxPaid));

    var extraVehicleTaxPaid = that.getExtraVehicleTaxPaid();
    $('#select-extra-vehicle-tax').text(that.formatTaxAmount(extraVehicleTaxPaid));

    var garbageTaxPaid = that.getGarbageTaxPaid();
    $('#select-garbage-tax').text(that.formatTaxAmount(garbageTaxPaid));

    var parkingTaxPaid = that.getParkingTaxPaid();
    $('#select-parking-tax').text(that.formatTaxAmount(parkingTaxPaid));

    totalTaxPaid = houseTaxPaid + vehicleTaxPaid + extraVehicleTaxPaid + garbageTaxPaid + parkingTaxPaid;
    $('#tax-amount-paid').text(that.formatTaxAmount(totalTaxPaid));
    // XXX: window.location.hash = 'ingresos='+getIncomeInEuros();
  
    that.redrawGrid();
  };


  that.setup = function(_breakdown, _getBreakdownValue) {
    breakdown         = _breakdown;
    getBreakdownValue = _getBreakdownValue;
    // Set redraw listener
    $('select').change(that.redraw);
    that.redraw();
  };


  return that;

})();