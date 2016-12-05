function BudgetSummary(_selector) {

  var selector      = _selector,
      areaNames     = null,
      colors        = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#e7969c', '#bcbd22', '#17becf'],
      data          = [],
      view          = null,
      year          = null,
      bar,
      barItems;
  

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
    // Insert bar element
    bar = d3.select(selector)
      .append('div')
       .attr('class','budget-summary');

    return this;
  };


  // Update
  this.update = function( _breakdown, _areaNames, _field, _view, _year ) {
    // Avoid redundancy
    if (view == _view && year == _year)
      return;

    // Clear bar items if view changes
    if (view != _view && barItems) {
      bar.selectAll('.budget-summary-item').remove();
    }

    setupData( _breakdown, _areaNames, _field, _year );
    updateItems();

    year = _year;
    view = _view;

    return this;
  };


  // Setup Data
  function setupData( _breakdown, _areaNames, _field, _year ) {
    // Update area names
    areaNames = _areaNames;

    // Reset variables holding the data.
    // Note that a BudgetSummary object can be setup a number of times, so this is needed.
    var area,
        areaAmounts = {},
        i,
        policyAmount,
        totalAmount = 0;

    // Group breakdown by area
    for (i in _breakdown.sub) {
      policyAmount = _breakdown.sub[i][_field][_year];
      // Avoid undefined or negative values
      if (policyAmount !== undefined && policyAmount >= 0) {
        area = i[0];
        areaAmounts[area] = (areaAmounts[area]||0) + policyAmount;
        totalAmount = totalAmount + policyAmount;
      }
    }

    // Setup existings areas
    data = d3.entries(areaAmounts);
    data.forEach(function(d){
      d.percentage = 100*d.value/totalAmount;
    });
    data.sort(function(a, b) { return b.value - a.value; });
  }

  // Update Items
  function updateItems() {
    // Data Join
    barItems = bar.selectAll('.budget-summary-item')
      .data(data);

    // Exit
    barItems.exit().remove();

    // Update
    barItems
      .style('width', setSummaryItemWidth);
    // Set bar color & percentage
    bar.selectAll('.budget-summary-bar')
      .data(data)
      .style('background-color', setSummaryItemColor)
      .html(setSummaryItemPercentage);
    // Set item label
    bar.selectAll('.budget-summary-label')
      .data(data)
      .html(setSummaryItemLabel);
  
    // Enter
    barItems.enter()
      .call(setSummaryItem);
  }

  // Enter Summary Items
  function setSummaryItem(selection){
    // Set item
    var item = selection
      .append('div')
        .attr('class', 'budget-summary-item')
        .style('width', setSummaryItemWidth);
    // Set item bar
    item.append('div')
      .attr('class', 'budget-summary-bar')
      .style('background-color', setSummaryItemColor)
      .html(setSummaryItemPercentage)
      .on('mouseover', onSummaryItemOver)
      .on('mouseout', onSummaryItemOut);
    // Set item label
    item.append('div')
      .attr('class', 'budget-summary-label')
      .html(setSummaryItemLabel);
  }

  function onSummaryItemOver(e){
    bar.selectAll('.budget-summary-item')
      .classed('inactive', function(d) { return d.key !== e.key; })
      .classed('active', function(d) { return d.key === e.key; });
    $(selector).trigger('budget-summary-over', {id: e.key});
  }

  function onSummaryItemOut(e){
    bar.selectAll('.budget-summary-item').classed('inactive', false).classed('active', false);
    $(selector).trigger('budget-summary-out');
  }
  
  function setSummaryItemWidth(d) {
    return d.percentage+'%';
  }

  function setSummaryItemColor(d) {
    return colors[Number(d.key)];
  }

  function setSummaryItemPercentage(d) {
    return ( d.percentage >= 6 ) ? formatDecimal(d.percentage, 1)+'<small>%</small>' : '';
  }

  function setSummaryItemLabel(d) {
    return (d.percentage >= 6 ) ? areaNames[d.key] : '';
  }
}
