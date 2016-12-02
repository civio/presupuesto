function BudgetSummary(_selector) {

  var selector      = _selector,
      areaAmounts   = {},
      areaNames     = null,
      colors        = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#e7969c', '#bcbd22', '#17becf'],
      existingAreas = [],
      totalAmount   = 0,
      view          = null,
      year          = null,
      $bar,
      $barItems;
  

  // Getters/Setters
  this.colors = function(_) {
    if (!arguments.length) return colors;
    if (_.length > 0){
      colors = _;
    }
    return this;
  };


  // Setup
  this.setup = function() {
    // Setup bar element
    $bar = $('<div class="budget-summary"></div>');

    // Insert bar in the DOM
    $(selector).empty().append( $bar );

    return this;
  };


  // Update
  this.update = function( _breakdown, _areaNames, _field, _view, _year ) {
    if (view == _view && year == _year) return;

    // Setup
    if (view != _view) {
      setupData( _breakdown, _areaNames, _field, _year );
      setupItems();
    }
    // Update
    else {
      setupData( _breakdown, _areaNames, _field, _year );
      updateItems();
    }

    year = _year;
    view = _view;

    return this;
  };


  // Setup Data
  function setupData( _breakdown, _areaNames, _field, _year ) {

    areaNames   = _areaNames;

    // Reset variables holding the data.
    // Note that a BudgetSummary object can be setup a number of times, so this is needed.
    areaAmounts = {};
    totalAmount = 0;

    // Group breakdown by area
    var i, area;
    for (i in _breakdown.sub) {
      var policyAmount = _breakdown.sub[i][_field][_year];
      if ( policyAmount !== undefined ) {
        area = i[0];
        areaAmounts[area] = (areaAmounts[area]||0) + policyAmount;
        totalAmount = totalAmount + policyAmount;
      }
    }

    // Sort areas
    existingAreas = [];
    for (area in areaAmounts) existingAreas.push(area);
    existingAreas.sort(function(a, b) { return areaAmounts[b] - areaAmounts[a]; });
  }


  // Setup Items
  function setupItems() {

    // Clear conteiner
    $bar.empty();

    // Render Items
    var i,
        area,
        percentage,
        label,
        amountLabel;

    for (i = 0; i < existingAreas.length; i++) {
      area = existingAreas[i];
      percentage = 100 * areaAmounts[area] / totalAmount;
      // Hide  Labels if area is small (< 6% width)
      label = (percentage >= 6 ) ? areaNames[area] : '';
      amountLabel = ( percentage >= 6 ) ? formatDecimal(percentage, 1)+'<small>%</small>' : '';
      
      $bar.append( '<div class="budget-summary-item" style="width:'+percentage+'%;">'+
                    '<div class="budget-summary-bar" data-id="'+area+'" style="background-color: '+colors[Number(area)]+';">'+amountLabel+
                    '</div><div class="budget-summary-label">'+label+'</div></div>');
    }

    $barItems = $bar.find('.budget-summary-item');
    
    // Hover events
    $barItems.find('.budget-summary-bar')
      .mouseover(function(e){
        $barItems.addClass('inactive');
        $(this).parent().removeClass('inactive').addClass('active');
        $(selector).trigger('budget-summary-over', {id: $(this).data('id')});
      })
      .mouseout(function(e){
        $barItems.removeClass('inactive active');
        $(selector).trigger('budget-summary-out');
      });
  }


  // Update Items
  function updateItems() {
    var i,
        area,
        percentage,
        label,
        amountLabel,
        barItem;
    for (i = 0; i < existingAreas.length; i++) {
      area = existingAreas[i];
      percentage = 100 * areaAmounts[area] / totalAmount;
      label = (percentage >= 6 ) ? areaNames[area] : ''; // Hide labels if area is small (< 6% width)
      amountLabel = ( percentage >= 6 ) ? formatDecimal(percentage, 1)+'<small>%</small>' : '';

      barItem = $($barItems.get(i));
      barItem.css('width', percentage+'%');
      barItem.find('.budget-summary-bar')
        .data('id', area)
        .html(amountLabel)
        .css('background-color', colors[Number(area)]);
      barItem.find('.budget-summary-label')
        .html(label);
    }
  }
}
