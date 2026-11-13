/**
 *  Helper methods for the breakdowns sent by the server (BudgetBreakdown.to_json)
 *  Used by the treemap, the stacked chart and the summary bar
 */

var BreakdownHelpers = (function() {

  // For each year, the column with the latest complete figures: the execution if the
  // year is over, otherwise the budget. Execution data for a year that is not over
  // (its budget status is not empty) is partial, so we ignore it. Returns {year: column}.
  function latestCompleteColumns(breakdown, budgetStatuses) {
    var columns = {};
    for (var column in breakdown.years) {
      var year = breakdown.years[column],
          isActual = column.indexOf('actual_') === 0;

      if ( isActual && budgetStatuses[year] )
        continue;

      if ( !columns[year] || isActual )
        columns[year] = column;
    }
    return columns;
  }

  // Public API
  return {
    latestCompleteColumns: latestCompleteColumns
  };

})();
