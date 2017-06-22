function BudgetTreemap(_selector, _stats, _budgetStatuses) {

  var selector            = _selector,
      stats               = _stats,
      budgetStatuses      = (_budgetStatuses) ? _budgetStatuses : {};

  var colors              = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#e7969c', '#bcbd22', '#17becf'],
      labelsMinSize       = 30,   // Minimum node size in px (width or height) to add a label
      labelsFontSizeMin   = 11,   // Nodes label minimum size in px
      labelsFontSizeMax   = 74,   // Nodes label maximum size in px
      treeLevels          = 1,    // Number of levels in treemap hierarchy (-1 allow to search all levels)
      mobileBreakpoint    = 620;  // Width size to use mobile layout
      
  var nodesPadding        = 8,    // Define padding of nodes label container
      transitionDuration  = 650,
      uiState             = {},
      yearTotals          = {},
      maxValue            = null;
      
  var areas,
      breakdown,
      colorScale,
      fontSizeScale,
      nodesContainer,
      nodes,
      treemap,
      treemapData,
      treemapItems,
      treemapRoot,
      $popup,
      width,
      height,
      treemapWidth,
      treemapHeight;


  // Getters/Setters
  this.colors = function(_) {
    if (!arguments.length) return colors;
    if (_.length > 0){
      colors = _;
      setColorScale();
    }
    return this;
  };

  this.labelsMinSize = function(_) {
    if (!arguments.length) return labelsMinSize;
    labelsMinSize = _;
    return this;
  };

  this.labelsFontSizeMin = function(_) {
    if (!arguments.length) return labelsFontSizeMin;
    labelsFontSizeMin = _;
    return this;
  };

  this.labelsFontSizeMax = function(_) {
    if (!arguments.length) return labelsFontSizeMax;
    labelsFontSizeMax = _;
    return this;
  };

  this.treeLevels = function(_) {
    if (!arguments.length) return treeLevels;
    treeLevels = _;
    return this;
  };


  // Setup & initialize treemap
  this.setup = function() {
    // Set popoup element
    $popup = $(selector+' .popover');

    // Setup color scale
    setColorScale();

    // Setup font-size scale (power of two scale)
    fontSizeScale = d3.scalePow()
      .exponent(0.75)
      .range([labelsFontSizeMin, labelsFontSizeMax])
      .clamp(true);

    // Set width & height dimensions
    setDimensions();

    // Setup nodes container
    nodesContainer = d3.select(selector)
      .append('div')
        .attr('class', 'nodes-container');

    return this;
  };

  this.getMaxValue = function(_breakdown, _areas, _uiState){

    breakdown = _breakdown;
    areas     = _areas;
    uiState   = _uiState;

    // Load the data. We do it here, and not at object creation time, so we have time
    // to change default settings (treemap depth, f.ex.) if needed
    loadBreakdown(breakdown, uiState.field);

    // Do nothing if there's no data
    if (!yearTotals[uiState.year] || !yearTotals[uiState.year][uiState.field])
      return null;

    return calculateMaxTreemapValueEver();
  };

  // Update treemap data
  this.update = function(_breakdown, _areas, _uiState, _maxValue) {
    // Avoid redundancy
    if (uiState.view === _uiState.view && uiState.year === _uiState.year && uiState.format === _uiState.format)
      return;

    maxValue = _maxValue;

    // Setup if view changes
    if (uiState.view !== _uiState.view) {
      breakdown = _breakdown;
      areas     = _areas;
      uiState   = _uiState;
      setupTreemap();
    }
    // Update with animation
    else {
      uiState = _uiState;
      updateTreemap();
    }

    return this;
  };

  // Resize treemap
  this.resize = function(){
    // Skip if container width don't change
    if ($(selector).width() === width)
      return;

    // Set width & height dimensions
    setDimensions();

    // Set treemap dimensions
    setTreemapDimensions(false);

    // Update tremap size
    treemap.size([treemapWidth,treemapHeight]);
    treemap(treemapRoot);

    // Update nodes data
    nodes.data(treemapRoot.leaves());

    // Update nodes attributes & its labels
    nodes
      .call(setNode)
      .call(setNodeTransition)
      .filter(isNodeLabelVisible)
        .call(setNodeLabel);

    return this;
  };

  // Public over/out methods
  this.areaOver = function(d) {
    var id = d.id.toString();
    nodes.classed('out', function(d) { return getParentId(d) !== id; });

    return this;
  };

  this.areaOut = function() {
    nodes.classed('out', false);

    return this;
  };


  // Setup the treemap
  function setupTreemap() {

    // Load the data. We do it here, and not at object creation time, so we have time
    // to change default settings (treemap depth, f.ex.) if needed
    loadBreakdown(breakdown, uiState.field);

    // Do nothing if there's no data
    if (!yearTotals[uiState.year] || !yearTotals[uiState.year][uiState.field])
      return;

    // calculate max value if null
    if (maxValue == null) {
      maxValue = calculateMaxTreemapValueEver();
    }

    setTreemapDimensions(false);

    // Setup treemap
    treemap = d3.treemap()
      .size([treemapWidth,treemapHeight])
      .padding(0)
      //.tile(d3.treemapSquarify)
      //.tile(d3.treemapSlice)
      //.tile(d3.treemapBinary)
      //.tile(d3.treemapSquarify.ratio(1))
      //.tile(d3.treemapResquarify) //.ratio(1))
      .round(true);
    if (width <= mobileBreakpoint) {
      treemap.tile(d3.treemapSlice);
    }
    treemapRoot = d3.stratify()(treemapData);
    treemapRoot
      .sum(function(d) { return d[uiState.year]; })
      .sort(function(a, b) { return b.value - a.value; });
    treemap(treemapRoot);

    // Clear previous nodes
    if (nodes) {
      nodes.remove();
    }

    // Add nodes
    nodes = nodesContainer.selectAll('.node')
      .data(treemapRoot.leaves())
      .enter().append('div')
        .attr('class', 'node')
        .on('mouseover', onNodeOver)
        .on('mousemove', onNodeMove)
        .on('mouseout',  onNodeOut)
        .on('click',     onNodeClick)
        .call(setNode)
        .call(setNodeTransition);
    
    // Add label only in nodes with size greater then labelsMinSize
    nodes
      .append('div')
        .attr('class', 'node-label')
        .style('visibility', 'hidden')  // Hide labels by default (setNodeLabel will show if node is bigger enought)
        .append('p')
          .text(function(d) { return d.data.name; });

    // Filter nodes with labels visibles (based on labelsMinSize) & set its label
    nodes.filter(isNodeLabelVisible)
      .call(setNodeLabel);
  }

  // Update the treemap with transition animation
  function updateTreemap() {

    // Do nothing if there's no data
    if (!yearTotals[uiState.year] || !yearTotals[uiState.year][uiState.field])
      return;

    // calculate max value if null
    if (maxValue == null) {
      maxValue = calculateMaxTreemapValueEver();
    }

    setTreemapDimensions(true);

    // Update tremap size
    treemap.size([treemapWidth,treemapHeight]);
    treemapRoot = d3.stratify()(treemapData);
    treemapRoot
      .sum(function(d) { return d[uiState.year]; })
      .sort(function(a, b) { return b.value - a.value; });
    treemap(treemapRoot);

    // Update nodes data & labels text
    nodes.data(treemapRoot.leaves())
      .select('.node-label')
      .style('visibility', 'hidden')  // Hide labels before transition
        .select('p')
          .text(function(d) { return d.data.name; });

    // Update nodes attributes
    nodes
      .call(setNode)
      .transition()
      .duration(transitionDuration)
      .on('end', function(d,i) {
        if (i == nodes.size()-1) {
          // Filter nodes with labels visibles (based on labelsMinSize) & set its label
          nodes.filter(isNodeLabelVisible)
            .call(setNodeLabel);
        }
      })
      .call(setNodeTransition);
  }

  // We use two different functions to set nodes attributes:
  // setNode for static attributes (padding, background, visibility)
  function setNode(selection){
    selection
      .style('padding',    function(d) { return (d.x1-d.x0 > 2*nodesPadding && d.y1-d.y0 > 2*nodesPadding ) ? nodesPadding+'px' : 0; })
      .style('background', function(d) { while (d.depth > 1) d = d.parent; return colorScale(getParentId(d)); })
      .style('visibility', function(d) { return (d.x1-d.x0 === 0) || (d.y1-d.y0 === 0) ? 'hidden' : 'visible'; })
      .select('.node-label')
        .style('visibility', 'hidden');
  }

  // setNodeTransition for attributes with transition animation (position & dimensions)
  function setNodeTransition(selection){
    selection
      .style('left',       function(d) { return d.x0 + 'px'; })
      .style('top',        function(d) { return d.y0 + 'px'; })
      .style('width',      function(d) { return d.x1-d.x0 + 'px'; })
      .style('height',     function(d) { return d.y1-d.y0 + 'px'; });
  }

  // Set nodes label size
  function setNodeLabel(selection) {
    var label,
        nodeWidth,
        nodeHeight,
        nodeArea,
        textWidth,
        size;

    // loop throught each item
    selection.each( function(d){
      label      = d3.select(this).select('.node-label');
      nodeWidth  = d.x1-d.x0 - (2*nodesPadding);
      nodeHeight = d.y1-d.y0 - (2*nodesPadding);
      nodeArea   = Math.sqrt(nodeWidth * nodeHeight);
      size       = Math.round(fontSizeScale(nodeArea));  // Set font size based on node area

      // Set node font-size based on its are
      label.style('font-size', size+'px');

      // Decrease font-size until text fits node width
      while (label.node().scrollWidth > nodeWidth && size > labelsFontSizeMin) {
        size--;
        label.style('font-size', size+'px');
      }
      // Decrease font-size until text fits node height
      while (label.node().scrollHeight > nodeHeight && size > labelsFontSizeMin) {
        size--;
        label.style('font-size', size+'px');
      }
      
      // Hide node label if doesn't fit node width or height
      label.style('visibility', (label.node().scrollWidth <= nodeWidth && label.node().scrollHeight <= nodeHeight) ? 'visible' : 'hidden');
    });
  }
  
  // Mouse Events handlers
  function onNodeOver(d) {
    var selected   = this;
    var id         = getParentId(d);
    var areaPrefix = areas[id] ? areas[id] : '';
    nodes.classed('out', function() { return this !== selected; });
    $popup.find('.popover-subtitle')
      .css('color', colorScale(id))
      .html(areaPrefix);
    $popup.find('.popover-title').html(d.data.name);
    $popup.find('.popover-content-value').html(valueFormat(d.value, uiState));
    $popup.show();
  }

  function onNodeMove(d) {
    var popParentOffset = $(selector).offset();
    var popLeft         = d3.event.pageX - popParentOffset.left - $popup.width()/2;
    var popBottom       = $(selector).height() - d3.event.pageY + popParentOffset.top + 15;
    $popup.css({'left':popLeft, 'bottom':popBottom});
  }

  function onNodeOut(d) {
    nodes.classed('out', false);
    $popup.hide();
  }

  function onNodeClick(d) {
    $(selector).trigger('policy-selected', d.data);
  }

  // Set main element dimensions
  function setDimensions() {
    width = $(selector).width();
    // Set height based on width container
    if (width > 1000) {
      height = width * 0.5;
    }
    else if (width > 780) {
      height = width * 0.5625;
    }
    else if (width > mobileBreakpoint) {
      height = width * 0.75;
    }
    else {
      height = width * 1.75;
    }
    // Set treempa tile based on width
    if (treemap) {
      if (width > mobileBreakpoint) {
        treemap.tile(d3.treemapSquarify);
      } else {
        treemap.tile(d3.treemapSlice);
      }
    }
    // Set main element height
    $(selector).height( height );
    // Update font-size scale domain
    fontSizeScale.domain([1, Math.sqrt(width*height) * 0.5]);
  }

  // Adjust the overall treemap size based on the size of this year's budget compared to the biggest ever
  function setTreemapDimensions(transition) {
    var ratio     = Math.sqrt( getValue(yearTotals[uiState.year][uiState.field], uiState.format, uiState.field, uiState.year) / maxValue );
    treemapWidth  = width * ratio;
    treemapHeight = height * ratio;

    // Set nodes container position
    nodesContainer
      .transition()
        .duration((transition) ? transitionDuration : 0)
        .style('top',  (height-treemapHeight)*0.5 + 'px')
        .style('left', (width-treemapWidth)*0.5 + 'px');
  }

  // Set colors scale based on colors array
  function setColorScale() {
    colorScale = d3.scaleOrdinal()
      .range(colors)
      .domain([0,1,2,3,4,5,6,7,8,9]);
  }

  // Calculate year totals, needed for percentage calculations later on
  function calculateYearTotals(breakdown, field, columns) {
    for (var year in columns) {
      if ( !yearTotals[year] )
        yearTotals[year] = {};
      var column_name = columns[year];
      yearTotals[year][field] = breakdown[field][column_name] || 0;
    }
  }

  // Convert the data to the format D3.js expects
  function loadBreakdownField(breakdown, field, columns) {
    var children = [{id: 'r'}], // Include root item in childrens array
        level = 0;

    // Recursive function to set children object
    function getChildrenTree(item, itemId, parentId, level) {
      var child,
          column_name;

      // Skip if object is empty
      if ($.isEmptyObject(item[field]))
        return;

      // Setup child object
      child = {
        id:       itemId,
        name:     item.label,
        parentId: parentId
      };

      // Check if item has childrens & we want to search for them (based on treeLevels)
      var hasChildrens = (treeLevels === -1 || level < treeLevels) && item.sub;

      // Get numerical data if has no childrens
      if (!hasChildrens) {
        var value, year;
        for (year in columns) {
          column_name = columns[year];
          value = item[field][column_name];
          // Avoid undefined or negative values
          if (value !== undefined && value >= 0) {
            child[year] = value;
          }
        }
      }

      // Add child to children array
      children.push(child);

      // Find childrens in children recursively
      if (hasChildrens) {
        for (var id in item.sub) {
          getChildrenTree(item.sub[id], id, itemId, level+1);
        }
      }
    }

    // Loop through each item
    for (var id in breakdown.sub) {
      getChildrenTree(breakdown.sub[id], id, 'r', 1);
    }

    return children;
  }

  function loadBreakdown(breakdown, field) {
    // Do nothing if there's no data
    if ( breakdown === null )
      return;

    // Pick the right column for each year: execution preferred over 'just' budget...
    // TODO: This bit is duplicated in BudgetStackedChart
    var columns = {}, year;
    for (var column_name in breakdown.years) {
      year = breakdown.years[column_name];

      // ...unless we know the execution data is not complete (the year is not over),
      // in which case we go with the budget.
      if ( budgetStatuses[year] && budgetStatuses[year]!=='' && column_name.indexOf("actual_")===0 )
        continue;

      // Normally we do this:
      if ( !columns[year] || column_name.indexOf("actual_")===0 )
        columns[year] = column_name;
    }

    // In some rather unusual cases we actually have no data: we may have one year of execution
    // data for a year that is not complete, for example. It happens. In those cases, we
    // hide the visualization. It's not ideal for a visualization to hide its parent container,
    // but there's not a simple clean solution: the way the code is structured now,
    // the calling code doesn't know whether there's data, since it involves looking into
    // budget statuses and so on (i.e. the code we just above)
    if ( Object.keys(columns).length === 0 )
      $(selector).hide();

    calculateYearTotals(breakdown, field, columns);
    // Get treemap data 
    treemapData = loadBreakdownField(breakdown, field, columns);
  }

  // Calculate the maximum value of the treemap along the years.
  // Note that we use already calculated 'year totals', which will use _either_ budget or actual
  // spending, not both. This matches the data we use for display. Using both budget and actual
  // would be wrong, although in normal scenarios the difference wouldn't be huge.
  function calculateMaxTreemapValueEver() {
    var year, val = 0;
    for (year in yearTotals) {
      val = Math.max( val, getValue(yearTotals[year][uiState.field] || 0, uiState.format, uiState.field, year) );
    }
    return val;
  }


  
  // Helper methods
  function getValue(value, format, field, year) {
    switch (format) {
      case "nominal":
        return value;
      case "real":
        return Formatter.adjustInflation(value, stats, year);
      case "percentage":
        var total = (field == "expense") ? yearTotals[year].expense : yearTotals[year].income;
        // Avoid division by zero (f.ex. when only one of the sides is available)
        return total > 0 ? value/total : 0;
      case "per_capita":
        var population = Formatter.getPopulationFigure(stats, year);
        return Formatter.adjustInflation(value, stats, year) / population;
    }
  }

  function valueFormat(value, uiState) {
    var transformedValue = getValue(value, uiState.format, uiState.field, uiState.year);
    switch (uiState.format) {
      case "nominal":
        return Formatter.amount(transformedValue);
      case "real":
        return Formatter.amount(transformedValue);
      case "percentage":
        return Formatter.percentage(transformedValue);
      case "per_capita":
        return Formatter.amountDecimal(transformedValue, .01);
    }
  }

  // Get first char of a string as parent id and return it as string
  function getParentId(d) {
    return d.id.charAt(0);
  }

  function isNodeLabelVisible(d){
    return d.x1-d.x0 > labelsMinSize && d.y1-d.y0 > labelsMinSize;
  }
}
