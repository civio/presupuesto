/**
 *  Helper methods for SlickGrid instances
 */

// TODO: This file needs some love to make it more Object Oriented. 

// FIXME: I should get rid of this when we remove SlickGrid
// We could then get rid of this awful global variables :/ We use them to remember the sorting
// status on UI updates (i.e. when changing the year), since we rebuild the grid on each page update.
// (I tried using getSortColumns() from the grid directly, to avoid tracking state myself, but
// couldn't get it to work)
var currentSortColumn = -1;
var currentSortOrder = null;

// FIXME: I should get rid of this when we remove SlickGrid
// Poor-man's auto key generator
var id = 0;

// Display column name depending on multi-level status
function rowNameFormatter(value, type, item) {
  var spacer = "<span style='display:inline-block;height:1px;width:" + (25 * item["indent"]) + "px'></span>";
  var valuewrap = "<span class='slick-cell-text toggle'>" + value + "</span>";
  if (item.sub && !$.isEmptyObject(item.sub)) {
    if (item._expanded) {
      return spacer + " <span class='toggle collapse'></span>" + valuewrap;
    } else {
      return spacer + " <span class='toggle expand'></span>" + valuewrap;
    }
  } else {
    return spacer + " <span class='toggle'></span>" + valuewrap;
  }
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
  }
}

// Convert a BudgetBreakdown object to an Array understood by SlickGrid
function breakdownToTable(breakdown, indent) {
  if (breakdown == null || breakdown.sub == null) return [];

  var gridData = [];
  indent = indent || 0;

  $.each(breakdown.sub, function(key, item) {

    // SlickGrid requires all items to have a unique id. I started using the business domain key,
    // which work most of the time, since budget programmes and such have unique ids (and we kept
    // the label in a separate field). But it failed when trying to show payments, or in general
    // any list where the id is actually a name, and those names can be duplicated. So we just
    // autogenerate a unique integer for the 'id' field and keep our business key in 'key'.
    item.id = (id+=1);
    item.key = key;
    item.indent = indent;
    item.parent = (indent === 0 ? null : breakdown);
    // Having a link to the root item allows us to calculate % of total
    item.root = (indent === 0 ? breakdown : breakdown.root);
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
function createBudgetGrid(containerName, data, userColumns, extraGridOptions) {
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
      item = data[dataIndex];

      // Check the parents' status
      var parent = item.parent;
      while (parent != null) {
        if (!parent._expanded)  return false;
        parent = parent.parent;
      }

      // Check whether there's any data in this row
      for (var i in columns) {
        // The 'i>0' means ignore the description column.
        if ( i>0 && row[i] != undefined && row[i] != null && row[i] != 0 ) return true;
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
      if ( a.parent == b ) {                // Parent-child: don't sort
        return 1;
      } else if ( a == b.parent ) {         // Parent-child: don't sort
        return -1;
      } else if ( a.parent == b.parent ) {  // Siblings
        return ascending ? simpleComparer(a, b) : simpleComparer(b, a);
      }

      // Travel up from the deeper item until the indent is the same, and
      // we'll eventually end up in one of the trivial cases above
      if ( a.indent > b.indent ) {
        return multiLevelComparer(a.parent, b, ascending);
      } else if ( a.indent < b.indent ) {
        return multiLevelComparer(a, b.parent, ascending);
      } else {
        return multiLevelComparer(a.parent, b.parent, ascending);
      }
    }

    jQuery.fn.dataTableExt.oSort['tree-asc']  = function(a, b) {
      return multiLevelComparer(a, b, true);
    };

    jQuery.fn.dataTableExt.oSort['tree-desc'] = function(a, b) {
      return multiLevelComparer(a, b, false);
    };

    return data;
  };

  // Create the data table
  var grid = $(containerName).DataTable({
    data: data,
    paging: false,
    dom: 't', // Only the table
    // responsive: true, See https://datatables.net/extensions/responsive/
    columns: columns,
    // Sort at startup by the previously chosen column; or by the rightmost column at startup
    // TODO: Actually, we're going to sort by the second column, I should use the rightmost... with data
    order: [[1, 'desc']]
  });

  // Handle toggling of items
  $(containerName+' tbody').on('click', 'span.toggle', function () {
    var cell = grid.cell( $(this).parent() )[0][0];
    var item = data[cell.row];
    item._expanded = !item._expanded;
    grid.draw();
  });

  return grid;
}

// Create a SlickGrid with budget data
// FIXME: I should get rid of this when we remove SlickGrid
function createSlickBudgetGrid(containerName, data, userColumns, extraGridOptions) {

  // Get a full SlickGrid column definition combining basic defaults with given options
  function getColumnDefinition(options) {
    var columnDefinition = {}; // No defaults right now, but they'd go here
    $.extend(columnDefinition, options);
    columnDefinition.id = columnDefinition.id || options.column || options.field;
    columnDefinition.name = columnDefinition.name || options.column || options.field;
    return columnDefinition;
  }

  // Decide whether an item should be displayed, based on whether its ancestors
  // are expanded.
  function multiLevelFilter(item, columns) {
    // Check the parents' status
    var parent = item.parent;
    while (parent != null) {
      if (!parent._expanded)  return false;
      parent = parent.parent;
    }

    // Check whether there's any data in this row
    var hasData = false;
    for (var i in columns) {
      // TODO: the 'i>0' means ignore the description column, but shouldn't be hardcoded.
      // Ideally there'd be a flag in the column def saying whether it's a data column f ex.
      var value = columnValueExtractor(item, columns[i]);
      if ( i>0 && value != undefined && value != null && value != 0 ) hasData=true;
    }
    return hasData;
  }

  var columns = [];
  $.each(userColumns, function(i, column) {
    columns[i] = getColumnDefinition(column);
  });

  var gridOptions = $.extend({
    enableCellNavigation: true,
    enableColumnReorder: false,
    autoHeight: true,
    forceFitColumns: true,
    rowHeight: 40,
    dataItemColumnValueExtractor: columnValueExtractor
  }, extraGridOptions);

  // initialize the model
  var dataView = new Slick.Data.DataView({ inlineFilters: true });
  dataView.beginUpdate();
  dataView.setItems(data);
  dataView.setFilter(multiLevelFilter);
  dataView.setFilterArgs(columns);
  dataView.endUpdate();

  // Set up metadata to add CSS classes based on row indent level
  dataView.getItemMetadata = function (row) {
    return { "cssClasses": "indent-"+dataView.getItem(row).indent };
  };

  // Initialize the grid
  var grid = new Slick.Grid(containerName, dataView, columns, gridOptions);

  // Handle toggling of items
  grid.onClick.subscribe(function (e, args) {
    if ($(e.target).hasClass("toggle")) {
      var item = dataView.getItem(args.row);
      if (item) {
        item._expanded = !item._expanded;
        dataView.updateItem(item.id, item);
      }
      e.stopImmediatePropagation();
    }
  });

  // Handle sorting
  grid.onSort.subscribe(function (e, args) {
    function simpleComparer(a, b) {
      var x = columnValueExtractor(a, args.sortCol) || 0; // For our purposes, not found => 0
      var y = columnValueExtractor(b, args.sortCol) || 0;

      // Google Chrome doesn't do stable sorting [1], i.e. the order of equal elements is
      // not deterministic. This breaks the multi-level sorting in the edge case of child
      // nodes belonging to equal parents, which happens for example when there's no data
      // for certain items. So to break the tie we just use the item id, so we get
      // deterministic behaviour and children sticking to their parent nodes.
      // [1]: https://code.google.com/p/v8/issues/detail?id=90
      return (x == y ? (a.id > b.id ? 1 : -1) : (x > y ? 1 : -1));
    }

    // A comparison function that can sort a table while keeping the parent-child hierarchy
    function multiLevelComparer(a, b) {
      // Handle trivial cases first...
      if ( a.parent == b ) {                // Parent-child: don't sort
        return (args.sortAsc ? 1 : -1);
      } else if ( a == b.parent ) {         // Parent-child: don't sort
        return (args.sortAsc ? -1 : 1);
      } else if ( a.parent == b.parent ) {  // Siblings
        return simpleComparer(a, b);
      }

      // Travel up from the deeper item until the indent is the same, and
      // we'll eventually end up in one of the trivial cases above
      if ( a.indent > b.indent ) {
        return multiLevelComparer(a.parent, b);
      } else if ( a.indent < b.indent ) {
        return multiLevelComparer(a, b.parent);
      } else {
        return multiLevelComparer(a.parent, b.parent);
      }
    }

    // Remember which column we're sorting by
    for ( i in columns ) {
      if (columns[i].name === args.sortCol.name) {
        currentSortColumn = i;
        currentSortOrder = args.sortAsc;
      }
    }

    dataView.sort(multiLevelComparer, args.sortAsc);
  });

  // Wire up model events to drive the grid
  dataView.onRowsChanged.subscribe(function (e, args) {
    grid.invalidateRows(args.rows);
    grid.updateRowCount();
    grid.render();
  });

  // Sort at startup by the previously chosen column; or by the rightmost column at startup
  // TODO: Actually, we're going to sort by the second column, I should use the rightmost... with data
  var sortColumnIndex = (currentSortColumn!=-1) ? currentSortColumn : 1;
  var sortCol = getColumnDefinition(columns[sortColumnIndex]);
  grid.onSort.notify({
      multiColumnSort: false,
      sortCol: sortCol,
      sortAsc: currentSortOrder}, null, grid);
  grid.setSortColumn(sortCol.id, currentSortOrder);

  return grid;
}

// Helper methods to return text labels
function isPartiallyExecuted(s) {
  return s && s!='';
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
