function BudgetSummary(selector) {

  var year          = null,
      view          = null,
      areaNames     = null,
      areaAmounts   = {},
      totalAmount   = 0,
      existingAreas = [],
      $bar          = $('<div class="budget-summary"></div>'),
      $barItems     = null;
  

  // Insert bar in the DOM
  $(selector).empty().append( $bar );


  // Setup Data
  this.setupData = function( _breakdown, _areaNames, _colorScale, _field, _year ){

    areaNames   = _areaNames;
    colorScale  = _colorScale;

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
  };


  // Setup Items
  this.setupItems = function(){

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
                    '<div class="budget-summary-bar" data-id="'+area+'" style="background-color: '+colorScale[Number(area)]+';">'+amountLabel+
                    '</div><div class="budget-summary-label">'+label+'</div></div>');
    }

    $barItems = $bar.find('.budget-summary-item');
    
    // Hover events
    $barItems.find('.budget-summary-bar')
      .mouseover(function(e){
        $barItems.addClass('inactive');
        $(this).parent().removeClass('inactive').addClass('active');
        // Hover Treemap Chart related items
        $('#'+view+'ChartContainer .cell:not(.cell-'+$(this).data('id')+')').addClass('out');
      })
      .mouseout(function(e){
        $barItems.removeClass('inactive active');
        $('#'+view+'ChartContainer .cell.out').removeClass('out');
      });
  };


  // Update Items
  this.updateItems = function() {
    var i,
        area,
        percentage,
        label,
        amountLabel,
        barItem;
    for (i = 0; i < existingAreas.length; i++) {
      area = existingAreas[i],
      percentage = 100 * areaAmounts[area] / totalAmount;
      label = (percentage >= 6 ) ? areaNames[area] : ''; // Hide labels if area is small (< 6% width)
      amountLabel = ( percentage >= 6 ) ? formatDecimal(percentage, 1)+'<small>%</small>' : '';

      barItem = $($barItems.get(i));
      barItem.css('width', percentage+'%');
      barItem.find('.budget-summary-bar')
        .data('id', area)
        .html(amountLabel)
        .css('background-color', colorScale[Number(area)]);
      barItem.find('.budget-summary-label')
        .html(label);
    }
  };


  // Update
  this.update = function( _breakdown, _areaNames, _colorScale, _field, _view, _year ) {
    if (view == _view && year == _year) return;

    // Setup
    if (view != _view) {
      this.setupData( _breakdown, _areaNames, _colorScale, _field, _year );
      this.setupItems();
    }
    // Update
    else {
      this.setupData( _breakdown, _areaNames, _colorScale, _field, _year );
      this.updateItems();
    }

    year = _year;
    view = _view;
  };
}
