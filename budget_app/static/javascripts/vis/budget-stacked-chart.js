function BudgetStackedChart(_selector, _stats, _colorScale, i18n) {

  var selector        = _selector;
  var stats           = _stats;
  var budgetStatuses  = {};
  var colorDomain     = [];
  var totals          = {};
  var colorScale      = (_colorScale && _colorScale.length > 0) ? _colorScale : null;
  var breakdown,
      years,
      items,
      values,
      uiState;

  
  // Getters/setters
  this.budgetStatuses = function(_) {
    if (!arguments.length) return _;
    budgetStatuses = _;
    return this;
  };

  this.colorDomain = function(_) {
    if (!arguments.length) return _;
    colorDomain = _;
    return this;
  };

  // The ticks in the Y axis sometimes get too long, so we show them as thousands/millions
  var formatAxis = function(d) {
    if (uiState.format === 'nominal' || uiState.format === 'real') {
      return Formatter.amountSimplified(100*d); // Formatter.amountSimplified expect value in cents
    } else {
      return Formatter.amount(d);
    }
  };
  
  function loadBreakdownField(breakdown, field) {
    // Pick the right dataset for each year: execution preferred over 'just' budget
    // TODO: This bit is duplicated in BudgetTreemap
    var columns = {};
    for (var column_name in breakdown.years) {
      var year = breakdown.years[column_name];

      // ...unless we know the execution data is not complete (the year is not over),
      // in which case we go with the budget.
      if (budgetStatuses[year] !== undefined && budgetStatuses[year] !== '' && column_name.indexOf('actual_') === 0)
        continue;

      // Normally we do this:
      if ( !columns[year] || column_name.indexOf('actual_') === 0 ) {
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

      for (var year in columns) {
        var column_name = columns[year];
        var amount = breakdown.sub[category][field][column_name] || 0;
        values.push({
          id: category,
          year: +year,
          value: amount
        });
      }
    }
  }

  // Format values array as needed for d3 stack
  // values is an array of objects with id, value & year properties
  function formatValues(values) {

    var formatValues = values;

    switch (uiState.format) {

      case 'real': // Adjust Inflation
        formatValues.forEach(function(d){
          d.value = Formatter.adjustInflation(d.value, stats, d.year);
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
          population = Formatter.getPopulationFigure(stats, d.year);
          d.value = Formatter.adjustInflation(d.value, stats, d.year) / population;
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

  this.loadBreakdown = function(_breakdown, _field) {
    breakdown = _breakdown;
    loadBreakdownField(_breakdown, _field);
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
      .tickFormat(Formatter.year);
    
    chart.yAxis.tickFormat(uiState.format == 'percentage' ? Formatter.percentageRounded : formatAxis);

    // Setup Color Scale
    chart.color = d3.scaleOrdinal(colorScale ? colorScale : d3.schemeCategory10).domain(colorDomain);

    // Setup budgeted literal
    chart.budgeted = i18n.budgeted;
    chart.proposed = i18n.proposed;

    // Setup data format
    chart.dataFormat = uiState.format;

    // Chart set data & draw
    chart
      .setData(formatValues(values), items, years.map(function(d){ return parseInt(d); }), budgetStatuses)
      .draw();
  
    return this;
  };
}