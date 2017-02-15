function BudgetStackedChart(theSelector, theStats, theColorScale, i18n) {

  var selector        = theSelector;
  var stats           = theStats;
  var budgetStatuses  = {};
  
  var breakdown;
  var years, items, values;
  var data            = []; // To remove !!!
  var modifiedData    = []; // To remove !!!
  var totals          = {};
  var uiState;
  
  // Getters/setters
  this.budgetStatuses = function(_) {
    if (!arguments.length) return _;
    budgetStatuses = _;
    return this;
  };

  // Formatting functions
  var formatPercent = d3.format('.0%');

  // The ticks in the Y axis sometimes get too long, so we show them as thousands/millions
  var formatAxis = function(d) {
    if ( uiState.format=="nominal" || uiState.format=="real" ) {
      return formatSimplifiedAmount(d, 1);

    } else {
      return formatAmount(d);
    }
  };

  // The color palette
  var colorScale =  (theColorScale && theColorScale.length > 0) ?
                    theColorScale :
                    ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#e7969c', '#bcbd22', '#17becf'];

  
  function loadBreakdownField(breakdown, field) {
    // Pick the right dataset for each year: execution preferred over 'just' budget
    // TODO: This bit is duplicated in BudgetTreemap
    var columns = {};
    for (var column_name in breakdown.years) {
      var year = breakdown.years[column_name];

      // ...unless we know the execution data is not complete (the year is not over),
      // in which case we go with the budget.
      if ( budgetStatuses[year]!==undefined && budgetStatuses[year]!='' && column_name.indexOf("actual_")===0 )
        continue;

      // Normally we do this:      
      if ( !columns[year] || column_name.indexOf("actual_") === 0 ) {
        columns[year] = column_name;
        totals[year] = breakdown[field][column_name];
      }
    }

    // Keep the years for later, when drawing the axis
    years = Object.keys(columns);

    // Convert the data to the format we need
    values = [];
    items = {};

    // Extract each category / year / value in result array
    for (var category in breakdown.sub) {

      items[category] = breakdown.sub[category].label;

      /*
      var programme = {
        id: category,
        key: breakdown.sub[category].label,
        values: []
      };
      var isEmpty = true;
      */

      for (var year in columns) {
        var column_name = columns[year];
        var amount = breakdown.sub[category][field][column_name] || 0;
        /*
        if ( amount )
          isEmpty = false;
        programme.values.push([+year, amount]);
        */
      
        values.push({
          id: category,
          year: +year,
          value: amount
        });
      }

      /*
      if (!isEmpty) {
        programme.values.sort();
        result.push(programme);
      }
      */
    }
  }

  // Format values array as needed for d3 stack
  // values is an array of objects with id, value & year properties
  function formatValues(values) {

    var formatValues = values;

    switch (uiState.format) {

      case 'real': // Adjust Inflation
        formatValues.forEach(function(d){
          d.value = adjustInflation(d.value, stats, d.year);
        });
        break;

      case 'percentage':
        formatValues.forEach(function(d){
          d.value = d.value / totals[d.year];
        });
        break;

      case 'per_capita':
        var population;
        formatValues.forEach(function(d){
          population = getPopulationFigure(stats, d.year);
          d.value = adjustInflation(d.value, stats, d.year) / population;
        });
        break;
    }

    // Group result array objects by year
    formatValues = d3.nest()
      .key(function(d) { return d.year; })
      .entries(formatValues);
      
    // Setup each year object as {year: 2015, categoryIdX: value, categoryIdY: value, ...}
    // a better format for d3 stack (https://github.com/d3/d3-shape/blob/master/README.md#_stack)
    formatValues = formatValues.map(function(d) {
      var obj = {year: d.key};
      d.values.forEach(function(e) {
        obj[e.id] = e.value;
      });
      return obj;
    });

    return formatValues;
  }

  this.loadBreakdown = function(theBreakdown, field) {

    breakdown = theBreakdown;
    data = loadBreakdownField(theBreakdown, field);
    // Deep copy the data array in order to be able to change when a new category of data is selected
    $.extend(true, modifiedData, data);

    return this;
  };

  // Function used to display the selected SAG
  this.draw = function( newUIState ) {
    // Do nothing if only the year changed
    if (uiState && uiState.format == newUIState.format && uiState.field == newUIState.field)
      return;

    uiState = newUIState;

    // Create chart
    var chart = new StackedAreaChart().setup(selector);
    
    // Setup X & Y axis
    chart.xAxis
      .tickValues(years)  // We make sure years only show up once in the axis
      .tickFormat(d3.format('d'));
    
    chart.yAxis.tickFormat(uiState.format == 'percentage' ? formatPercent : formatAxis);

    // Setup Color Scale
    chart.color = d3.scaleOrdinal(d3.schemeCategory10).range(colorScale);

    // Setup budgeted literal
    chart.budgeted = i18n.budgeted;
    chart.proposed = i18n.proposed;

    // Setup data format
    chart.dataFormat = uiState.format;

    // Chart set data & draw
    //chart.setData( getSortedData(this.getNewData()), years.map(function(d){ return parseInt(d); }), budgetStatuses ).draw();
    chart
      .setData(formatValues(values), items, years.map(function(d){ return parseInt(d); }), budgetStatuses)
      .draw();
  
    return this;
  };
}