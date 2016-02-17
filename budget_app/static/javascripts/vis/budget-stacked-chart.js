function BudgetStackedChart(theSelector, theStats, i18n) {
  var selector = theSelector;
  var stats = theStats;
  var budgetStatuses = {};
  var _ = i18n;

  var breakdown;
  var years;
  var data = [];
  var modifiedData = [];
  var totals = {};

  // Getters/setters
  this.budgetStatuses = function(_) {
    if (!arguments.length) return _;
    budgetStatuses = _;
    return this;
  };

  // Formatting functions
  var formatSPercent = d3.format("+.2%");
  var formatSPercentage = function(d) { return formatSPercent(d).replace(".",","); };
  var formatPercent = d3.format("%");
  var formatPercentage = function(d) { return formatPercent(d).replace(".",","); };
  var format = function(d) { return formatAmount(d); };

  // The ticks in the Y axis sometimes get too long, so we show them as thousands/millions
  var formatAxis = function(d) {
    if ( uiState.format=="nominal" || uiState.format=="real" ) {
      return formatSimplifiedAmount(d, 1);

    } else {
      return formatAmount(d);
    }
  };

  // The color palette. It should probably match the treemap one, but may be tweaked if needed
  // (most probably sorted around, so certain categories match certain colors).
  var category10 = [ "#A9A69F", "#D3C488", "#2BA9A0", "#E8A063", "#9EBF7B", "#dbb0c0", "#7d8f69", "#a29ac8", "#6c6592", "#9e9674", "#e377c2", "#e7969c", "#bcbd22", "#17becf" ];
  var colors = d3.scale.ordinal().range(category10).domain([0,1,2,3,4,5,6,7,8,9]);

  // Return a color for a given item. This relies a bit too much on domain knowledge: when
  // displaying programmes, just use the position (i), but when displaying a 0-9 category
  // (economic/funding), use the actual item value so color is consistent across programmes.
  var keyColor = function(d, i) {
    return colors(d['id'].length == 1 ? Number(d['id']) : i);
  };

  var uiState;

  
  function loadBreakdownField(breakdown, field) {
    // Pick the right dataset for each year: execution preferred over 'just' budget
    // TODO: This bit is duplicated in BudgetTreemap
    var columns = {};
    for (var column_name in breakdown.years) {
      var year = breakdown.years[column_name];

      // ...unless we know the execution data is not complete (the year is not over),
      // in which case we go with the budget.
      if ( budgetStatuses[year] && budgetStatuses[year]!='' && column_name.indexOf("actual_")===0 )
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
    result = [];
    for (var category in breakdown.sub) {
      var programme = {
        id: category,
        key: breakdown.sub[category].label,
        values: []
      };
      var isEmpty = true;

      for (var year in columns) {
        var column_name = columns[year];
        var amount = breakdown.sub[category][field][column_name] || 0;
        if ( amount )
          isEmpty = false;
        programme.values.push([+year, amount]);
      }

      if (!isEmpty) {
        programme.values.sort();
        result.push(programme);
      }
    }
    return result;
  }

  this.loadBreakdown = function(theBreakdown, field) {

    console.log('loadBreakdown', theBreakdown, field);

    breakdown = theBreakdown;
    data = loadBreakdownField(theBreakdown, field);
    // Deep copy the data array in order to be able to change when a new category of data is selected
    $.extend(true, modifiedData, data);
  };

  // Function used to display the selected SAG
  this.draw = function(newUIState) {
    // Do nothing if only the year changed
    if ( uiState && uiState.format==newUIState.format && uiState.field==newUIState.field ) return;

    uiState = newUIState;
    
    console.log(years);

    var chart = new StackedAreaChart().setup(selector);
    //chart.color = keyColor;

    chart.xAxis
        .tickValues( years )  // We make sure years only show up once in the axis
        .tickFormat( d3.format("d") );
    
    chart.yAxis
        .tickFormat( uiState.format == "percentage" ? formatPercentage : formatAxis );

    if( uiState.format == "percentage" ) chart.dataIsPercentage = true; // Update dataIsPercentage variable

    chart.setData( this.getNewData(), years.map(function(d){ return parseInt(d); }), budgetStatuses ).draw();
  };


  // Given the user selection get the newData we need to display in the SAG
  this.getNewData = function() {
    var newData = modifiedData,
        i, j;

    switch (uiState.format) {
      case "nominal":
        return data;

      case "real": // Adjust Inflation
        for (i = 0; i < newData.length; i++) {
            for (j = 0; j < newData[i].values.length; j++) {
              newData[i].values[j][1] = adjustInflation(data[i].values[j][1], stats, data[i].values[j][0]);
            }
        }
        return newData;

      case "percentage":
        var total;
        for (i = 0; i < newData.length; i++) {
            for (j = 0; j < newData[i].values.length; j++) {
              total = uiState.field == "expense" ?
                                            breakdown.expense[(data[i].values[j][0])] :
                                            breakdown.income[(data[i].values[j][0])];
              newData[i].values[j][1] = data[i].values[j][1] / totals[data[i].values[j][0]];
            }
        }
        return newData;

      case "per_capita":
        var population;
        for (i = 0; i < newData.length; i++) {
            for (j = 0; j < newData[i].values.length; j++) {
              population = getPopulationFigure(stats, data[i].values[j][0]);
              newData[i].values[j][1] = adjustInflation(data[i].values[j][1], stats, data[i].values[j][0]) / population;
            }
        }
        return newData;
    }
  };

  /*
  // Build the html that will be shown in the SAG tooltip once a specific area and year are mousedOver
  function tooltipContent(key, x, y, e, graph) {
    var value = e.point[1];
    var formattedValue = uiState.format != "percentage" ? format(value) : formatPercentage(value);
    var html = '<h3>' + key + '</h3><p class="amount">' + formattedValue + ' <span class="year">'+ _['in'] + x + '</span></p>';
    if (e.pointIndex > 0) {
      var yearAnt = e.series.values[(e.pointIndex-1)][0];
      var valueAnt = e.series.values[(e.pointIndex-1)][1];
      if (valueAnt != 0) {
        var percent = value/valueAnt -1;
        html += '<p class="percentage"><span class="highlight">'+formatSPercentage(percent)+'</span>'+_['versus']+yearAnt+'</p';
      }
    }
    return html;
  }
  */
}