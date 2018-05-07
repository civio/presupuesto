// VALUE FORMATTERS

var Formatter = (function() {

  var thousand, millions;

  // Setup format default locale
  if ($('html').attr('lang') == 'en') {
    d3.formatDefaultLocale({
      "currency": ["€",""],
      "decimal": ".",
      "thousands": ",",
      "grouping": [3]
    });
    thousand = "K";
    millions = "M";
  } else {
    d3.formatDefaultLocale({
      "currency": [""," €"],
      "decimal": ",",
      "thousands": ".",
      "grouping": [3]
    });
    thousand = "mil";
    millions = "mill.";
    if ($('html').attr('lang') == 'eu') {
      thousand = "mila";
      millions = "milioi";
    }
  }

  var that                        = {},
      formatInteger               = d3.format('d'),
      formatIntegerWithCommas     = d3.format(',d'),
      formatIntegerCurrency       = d3.format('$,d'),
      formatIntegerPercentage     = d3.format('.0%'),
      formatFloatPercentage       = d3.format('.2%'),
      formatFloatPercentageSigned = d3.format('+.1%');


  // Format year as integer number without commas
  that.year = function (value) {
    if (value == null) return '';
    return formatInteger(value);
  };

  // Pretty print a number by inserting thousand separator
  that.number = function (value) {
    if (value == null) return '';
    return formatIntegerWithCommas(value);
  };

  // Format decimal number
  that.decimal = function (value, precision) {
    if (value == null) return '';
    var p = d3.precisionFixed(precision || 1),
        f = d3.format(',.'+p+'f');
    return f(value);
  }

  // Format currency amount
  that.amount = function (value) {
    if (value == null) return '';
    return formatIntegerCurrency(value/100);
  };

  // Format decimal amount
  that.amountDecimal = function (value, precision) {
    if (value == null) return '';
    var p = d3.precisionFixed(precision || 1),
        f = d3.format('$,.'+p+'f');
    return f(value/100);
  };

  // Format currency amount
  that.amountSimplified = function (value) {
    if (value == null) return '';
    value = Number(value/100); // Also note value is in cents originally
    if (value >= 100000000) {
      var decimals = (value >= 1000000000) ? 0 : (value.toString()[1] == '0') ? 0 : .1;  // Use 1 decimal between 1 mill. & 10 mill. if is not round
      if ($('html').attr('lang') == 'en') {
        return that.amountDecimal(value/1000000, decimals)+' '+millions;
      } else {
        return that.amountDecimal(value/1000000, decimals).replace('€',millions+' €');
      }
    } else if (value >= 100000) {
      if ($('html').attr('lang') == 'en') {
        return that.amountDecimal(value/1000, 0)+' '+thousand;
      } else {
        return that.amountDecimal(value/1000, 0).replace('€',thousand+' €');
      }
    }
    return that.amount(value);
  };


  // Format percentage
  that.percentage = function (value) {
    return formatFloatPercentage(value);
  };

  that.percentageRounded = function (value) {
    return formatIntegerPercentage(value);
  };

  // Format percentage signed
  that.percentageSigned = function (value) {
    return formatFloatPercentageSigned(value);
  };


  // Data table formatters
  that.getFormatter = function (formatter, stats, year, getter) {
    // Pretty print a number by inserting ',' thousand separator
    function nominalFormatter(value, type, item) {
      if (type === 'filter') return value;  // We filter based on the raw data
      return that.amount(value);
    }

    // Display amount adjusted for inflation (real, versus nominal)
    function realFormatter(value, type, item) {
      if (value == null) return '';
      if (type === 'filter') return value;  // We filter based on the raw data
      var realValue = that.adjustInflation(value, stats, year);
      return that.amount(realValue);
    }

    // Display amount as percentage of total
    function percentageFormatter(value, type, item) {
      if (value == null) return '';
      if (type === 'filter') return value;  // We filter based on the raw data
      if (item.root == null)  // No root => independent object
        return that.percentage(1);
      else
        return that.percentage(value / columnValueExtractor(item.root, getter));
    }

    // Display amount as expense per capita
    function perCapitaFormatter(value, type, item) {
      if (value == null) return '';
      if (type === 'filter') return value;  // We filter based on the raw data
      var realValue = that.adjustInflation(value, stats, year);
      // Our stats for year X indicate the population for December 31st of that year so,
      // since we're adjusting inflation for January 1st it seems more accurate to use the
      // population for that date, i.e. the one for the last day of the previous year.
      // XXX: Don't think this is still so, and it's confusing, so I've changed it. But
      // would like to recheck it.
      var population = that.getPopulationFigure(stats, year, item.key);
      return that.amountDecimal(realValue / population, .01);
    }

    switch (formatter) {
      case "nominal":     return nominalFormatter;
      case "real":        return realFormatter;
      case "percentage":  return percentageFormatter;
      case "per_capita":  return perCapitaFormatter;
    }
  };


  // Convenience methods

  that.getPopulationFigure = function (stats, year, entity_id) {
    // Standard scenario: we get an array of population figures by year, we just pick the right one
    var population = stats.population[year];

    // More complex one: we're displaying a list of entities, each with their own stats
    if (population === undefined) {
      if (entity_id === undefined)
        return undefined; // A breakdown total or similar case, not much we can do

      stats = stats.population[entity_id];
      if (stats === undefined) {
        console.warn("Couldn't find population stats for "+entity_id+".");
        return undefined;
      }
      population = stats[year];
    }

    return population;
  }

  that.adjustInflation = function (value, stats, year) {
    if ( value === undefined || isNaN(year) )
      return undefined;

    // The inflation index in the stats refers to the last day of the year. We adjust the budget
    // assuming it happens on January 1st, so we use the inflation index _of the year before_.
    // Think of it like this: when looking at the budget for 2012 in 2012, nominal=real. This is
    // so because the inflation index at December 31st 2011 is 100, i.e. nominal=real.
    return value / stats['inflation'][year-1].inflation_index * 100.0;
  }

  return that;

})();