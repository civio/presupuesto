/**
 *  Helper methods for DataTables instances
 */

// We use this to remember the sorting status on UI updates (i.e. when changing
// the year), since we rebuild the grid on each page update.
var lastSort = null;

// TODO: Can we get rid of this now that we removed SlickGrid? See below.
// Poor-man's auto key generator
var id = 0;

// Used by addEconomicCategoryPrefix to get the economic bit out an item's uid
// TODO: Is there a better way? Feels like a waste of effort, plus dirty.
var itemUidRegexp = /(\d+)\/?$/;

// Display column name depending on multi-level status
function rowNameFormatter(value, type, item) {
  var valuewrap = "<span class='toggle'>" + value + "</span>";
  var toggleStatus = '';
  if (item.sub && !$.isEmptyObject(item.sub)) {
    toggleStatus = item._expanded ? 'collapse' : 'expand';
    toggleValue = item._expanded ? '–' : '+';
    return "<a class='toggle "+toggleStatus+"'>"+toggleValue+"</a>" + valuewrap;
  }
  return valuewrap;
}

// Return the value for a grid element, aware of the BudgetBreakdown structure.
// If the column does not exist at all, return null. If it's only this particular
// cell that does not exist, return 0. 
// This makes sense when dealing with an exhaustive data set like a budget: 
// if something is not present we know it's because the assigned amount is zero. 
// An item may show up on one side (budget) but not the other (execution), hence
// displaying a zero (and not just a blank) is the right thing to do.
function getBreakdownValueFunction(field, column) {
  return function(item) {
    if ( item.root != null && item.root.years[column] === undefined )
      return null;

    return item[field][column] || 0;
  };
}

// Convert a BudgetBreakdown object to an Array understood by DataTables
function breakdownToTable(breakdown, indent) {
  if (breakdown === null || breakdown.sub === null) return [];

  var gridData = [];
  indent = indent || 0;

  $.each(breakdown.sub, function(key, item) {

    // SlickGrid required all items to have a unique id. I started using the business domain key,
    // which work most of the time, since budget programmes and such have unique ids (and we kept
    // the label in a separate field). But it failed when trying to show payments, or in general
    // any list where the id is actually a name, and those names can be duplicated. So we just
    // autogenerate a unique integer for the 'id' field and keep our business key in 'key'.
    // Now that we use DataTables it _may_ not be needed anymore, but we've found another use for it
    // since then: making sorting estable (see below). We _may_ be able to use something else
    // for that, like the object id.
    item.id = (id+=1);
    item.key = key;
    item.indent = indent;
    item._expanded = false;
    item._parent = (indent === 0) ? null : breakdown;
    // Having a link to the root item allows us to calculate % of total
    item.root = (indent === 0) ? breakdown : breakdown.root;
    gridData.push(item);

    // Add the children information
    $.merge(gridData, breakdownToTable(item, indent+1));
  });

  return gridData;
}

// Make the data access mechanism more flexible
function columnValueExtractor(item, getter) {
  if (typeof getter === 'function')
    return getter(item);
  else
    return item[getter];   // Default behaviour, just return a field
}

// Create a DataTable with budget data
function createBudgetGrid(containerName, data, userColumns, i18n, startingSort) {
  // Add some default settings to the column definitions given by the user
  var columns = [];
  $.each(userColumns, function(i, column) {
    var defaultColumnDefinition = { sType: 'tree', orderDataType: 'tree' };
    columns[i] = $.extend(defaultColumnDefinition, column);
  });

  // Custom filtering function. Decides whether an item should be displayed,
  // based on whether its ancestors are expanded.
  $.fn.dataTable.ext.search = [
    function(settings, row, dataIndex) {
      
      var item = settings.oInit.data[dataIndex];

      // Check the parents' status
      var parent = item._parent;
      while (parent) {
        if (parent._expanded !== true) return false;
        parent = parent._parent;
      }

      // Check whether there's any data in this row
      for (var i in columns) {
        // The 'i>0' means ignore the description column.
        // TODO: Why did I have to add the string comparisons on the subprogrammes branch?
        // How is it related?
        if ( i>0 && row[i] !== undefined && row[i] !== null && row[i] !== 0 && row[i] !== '0' && row[i] !== '' ) return true;
      }

      return false;
    }
  ];

  // We need to create a custom sorter to respect the item hierarchy
  $.fn.dataTable.ext.order['tree'] = function(settings, column) {
    function simpleComparer(a, b) {
      var valueGetter = columns[column].data;
      var x = columnValueExtractor(a, valueGetter) || 0; // For our purposes, not found => 0
      var y = columnValueExtractor(b, valueGetter) || 0;

      // Google Chrome doesn't do stable sorting [1], i.e. the order of equal elements is
      // not deterministic. This breaks the multi-level sorting in the edge case of child
      // nodes belonging to equal parents, which happens for example when there's no data
      // for certain items. So to break the tie we just use the item id, so we get
      // deterministic behaviour and children sticking to their parent nodes.
      // [1]: https://code.google.com/p/v8/issues/detail?id=90
      return (x == y ? (a.id < b.id ? -1 : 1) : (x < y ? -1 : 1));
    }

    // A comparison function that can sort a table while keeping the parent-child hierarchy
    function multiLevelComparer(a, b, ascending) {
      // Handle trivial cases first...
      if ( a._parent == b ) {                // Parent-child: don't sort
        return 1;
      } else if ( a == b._parent ) {         // Parent-child: don't sort
        return -1;
      } else if ( a._parent == b._parent ) {  // Siblings
        return ascending ? simpleComparer(a, b) : simpleComparer(b, a);
      }

      // Travel up from the deeper item until the indent is the same, and
      // we'll eventually end up in one of the trivial cases above
      if ( a.indent > b.indent ) {
        return multiLevelComparer(a._parent, b, ascending);
      } else if ( a.indent < b.indent ) {
        return multiLevelComparer(a, b._parent, ascending);
      } else {
        return multiLevelComparer(a._parent, b._parent, ascending);
      }
    }

    jQuery.fn.dataTableExt.oSort['tree-asc']  = function(a, b) {
      return multiLevelComparer(a, b, true);
    };

    jQuery.fn.dataTableExt.oSort['tree-desc'] = function(a, b) {
      return multiLevelComparer(a, b, false);
    };

    // Keep track of the last order, so we can keep it when recreating the table
    lastSort = settings.aaSorting;

    return settings.oInit.data;
  };

  // Create the data table
  grid = $(containerName).DataTable({
    data: data,
    paging: false,
    dom: 't', // Only the table
    // responsive: true, See https://datatables.net/extensions/responsive/
    columns: columns,
    // Sort at startup by the previously chosen column; or by the rightmost column at startup
    // TODO: Actually, we're going to sort by the second column, I should use the rightmost... with data
    order: lastSort ? lastSort : (startingSort===undefined ? [[1, 'desc']] : startingSort),
    rowCallback: function(row, data) { $(row).addClass('indent-'+data.indent); },
    // i18n (TODO: enable translations)
    language: {
      'zeroRecords': 'No hay datos para este año',
      'aria': i18n
    }
  });

  // Handle toggling of items
  $(containerName+' tbody').off('click', '.toggle').on('click', '.toggle', function (e) {
    if ($(e.target).hasClass("toggle")) {
      var cell = grid.cell( $(this).parent() );
      var item = data[cell[0][0].row];
      item._expanded = !item._expanded;
      cell.invalidate();
      grid.draw();
    }
  });

  return grid;
}

// Helper methods to return text labels
function isPartiallyExecuted(s) {
  return s && s!=='' && s!=='0T' && s!=='0M';
}

function getExecutionColumnName(budgetStatus, label, budgetStatusLabels) {
  return isPartiallyExecuted(budgetStatus) ?
            "<abbr title='("+budgetStatusLabels[budgetStatus]+")'>"+label+"*</abbr>" :
            label;
}

function getExecutionTotalLabel(budgetStatus, budgetStatusLabels) {
  return isPartiallyExecuted(budgetStatus) ?
            " <small>("+budgetStatusLabels[budgetStatus]+")</small>" :
            "";
}

function addEconomicCategoryPrefix(item) {
  var match = itemUidRegexp.exec(item.key);
  var code = match ? match[1] : item.key;
  return code + '. ' + item.label;
}
