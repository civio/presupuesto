function BudgetSummary(selector, breakdown, areaNames, colorScale, field, year) {

  // Group breakdown by area
  var areaAmounts = {};
  var totalAmount = 0;
  var i, area;

  for (i in breakdown.sub) {
    var policyAmount = breakdown.sub[i][field][year];
    if ( policyAmount !== undefined ) {
      area = i[0];
      areaAmounts[area] = (areaAmounts[area]||0) + policyAmount;
      totalAmount = totalAmount + policyAmount;
    }
  }

  // Sort areas
  var existingAreas = [];
  for (area in areaAmounts) existingAreas.push(area);
  existingAreas.sort(function(a, b) { return areaAmounts[b] - areaAmounts[a]; });

  // Render
  var $bar = $('<div class="budget-summary"></div>');
  $(selector).empty().append( $bar );

  for (i = 0; i < existingAreas.length; i++) {
    area = existingAreas[i];
    var percentage = 100 * areaAmounts[area] / totalAmount;
    // Hide  Labels if area is small (< 6% width)
    var label = (percentage >= 6 ) ? areaNames[area] : '';
    var amountLabel = ( percentage >= 6 ) ? formatDecimal(percentage, 1)+'<small>%</small>' : '';
    
    $bar.append( '<div class="budget-summary-item" style="width:'+percentage+'%;">'+
                  '<div class="budget-summary-bar" data-id="'+area+'" style="background-color: '+colorScale[Number(area)]+';">'+amountLabel+
                  '</div><div class="budget-summary-label">'+label+'</div></div>');
  }

  var $barItems = $bar.find('.budget-summary-item');
  
  // Hover styles
  $barItems.find('.budget-summary-bar')
    .mouseover(function(e){
      $barItems.addClass('inactive');
      $(this).parent().removeClass('inactive').addClass('active');
      // Hover Treemap Chart related items
      $( selector.replace('Summary', 'Chart') ).find('.cell:not(.cell-'+$(this).data('id')+')').addClass('out');
    })
    .mouseout(function(e){
      $barItems.removeClass('inactive active');
      $( selector.replace('Summary', 'Chart') ).find('.cell.out').removeClass('out');
    });
}
