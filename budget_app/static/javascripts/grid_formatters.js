// VALUE FORMATTERS

// Setup numeral format language
numeral.language($('html').attr('lang'));

// Global variables defined here to allow themes to override them.
// See http://stackoverflow.com/a/4862268 for a discussion of global variables.
window.percentage_sign_suffix = ' %';

// Pretty print a number by inserting ',' thousand separator
function formatNumber(value) {
  if (value == null) return '';
  return numeral( value ).format( '0,0', Math.floor );
}

// Add currency symbol to a given string, already formatted
function addCurrencySymbol(formattedValue) {
  return numeral.language()=='en' ? '€'+formattedValue : formattedValue+'\xA0€';
}

// Format currency amount
function formatAmount(value) {
  if (value == null) return '';
  value = Number(value/100); // Also note value is in cents originally
  return addCurrencySymbol(formatNumber(value));
}

// Format decimal amount
function formatDecimalAmount(value, precision) {
  if (value == null) return '';
  value = Number(value/100); // Also note value is in cents originally
  return addCurrencySymbol(formatDecimal(value), precision);
}

// Format currency amount
function formatSimplifiedAmount(value) {
  if (value == null) return '';
  value = Number(value/100); // Also note value is in cents originally

  if (value >= 1000000) {
    var precision = (value >= 10000000 ? 0 : 1);  // Best-guess number of decimals to show
    return addCurrencySymbol(formatDecimal(value/1000000, precision)+'\xA0mill.');
  } else if (value >= 1000) {
    var precision = (value >= 10000 ? 0 : 1);
    return addCurrencySymbol(formatDecimal(value/1000, precision)+'\xA0mil');
  } else
    return addCurrencySymbol(formatNumber(value));
}

// Format decimal number
function formatDecimal(value, precision) {
  if (value == null) return '';

  var rule = '0,0.00';
  if (precision !== undefined) {
    if (precision > 0) {
      rule = '0,0.0';
      while (precision > 1) {
        rule += '0';
        precision--;
      }
    } else {
      rule = '0,0';
    }
  }

  return numeral( value ).format( rule, Math.round );
}

// Format percentage
function formatPercentage(value) {
  return formatDecimal(value*100)+window.percentage_sign_suffix;
}


// Data table formatters
function getFormatter(formatter, stats, year, getter) {
  // Pretty print a number by inserting ',' thousand separator
  function nominalFormatter(value, type, item) {
    if (type === 'filter') return value;  // We filter based on the raw data
    return formatAmount(value);
  }

  // Display amount adjusted for inflation (real, versus nominal)
  function realFormatter(value, type, item) {
    if (value == null) return '';
    if (type === 'filter') return value;  // We filter based on the raw data
    var realValue = adjustInflation(value, stats, year);
    return formatAmount(realValue);
  }

  // Display amount as percentage of total
  function percentageFormatter(value, type, item) {
    if (value == null) return '';
    if (type === 'filter') return value;  // We filter based on the raw data
    if (item.root == null)  // No root => independent object
      return formatPercentage(1);
    else
      return formatPercentage(value / columnValueExtractor(item.root, getter));
  }

  // Display amount as expense per capita
  function perCapitaFormatter(value, type, item) {
    if (value == null) return '';
    if (type === 'filter') return value;  // We filter based on the raw data
    // Note value is in cents originally
    var realValue = adjustInflation(value/100, stats, year);

    // Our stats for year X indicate the population for December 31st of that year so,
    // since we're adjusting inflation for January 1st it seems more accurate to use the
    // population for that date, i.e. the one for the last day of the previous year.
    // XXX: Don't think this is still so, and it's confusing, so I've changed it. But
    // would like to recheck it.
    var population = getPopulationFigure(stats, year, item.key);

    return addCurrencySymbol(formatDecimal(realValue / population));
  }

  switch (formatter) {
    case "nominal":     return nominalFormatter;
    case "real":        return realFormatter;
    case "percentage":  return percentageFormatter;
    case "per_capita":  return perCapitaFormatter;
  }
}


// Convenience methods

function getPopulationFigure(stats, year, entity_id) {
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

function adjustInflation(value, stats, year) {
  if ( value === undefined )
    return undefined;

  // The inflation index in the stats refers to the last day of the year. We adjust the budget
  // assuming it happens on January 1st, so we use the inflation index _of the year before_.
  // Think of it like this: when looking at the budget for 2012 in 2012, nominal=real. This is
  // so because the inflation index at December 31st 2011 is 100, i.e. nominal=real.
  return value / stats['inflation'][year-1].inflation_index * 100.0;
}
