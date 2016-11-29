function BudgetTreemap(_selector, _stats, _budgetStatuses) {

  var selector            = _selector,
      stats               = _stats,
      budgetStatuses      = (_budgetStatuses) ? _budgetStatuses : {};

  var colors              = ['#A9A69F', '#D3C488', '#2BA9A0', '#E8A063', '#9EBF7B', '#dbb0c0', '#7d8f69', '#a29ac8', '#6c6592', '#9e9674', '#e377c2', '#e7969c', '#bcbd22', '#17becf'],
      labelsMinSize       = 70,   // Minimum node size in px (width or height) to add a label
      labelsFontSizeMin   = 11,   // Nodes label minimum size in px
      labelsFontSizeMax   = 74,   // Nodes label maximum size in px
      nodesPadding        = 8,    // Define padding of nodes label container
      transitionDuration  = 650;

  var formatPercent       = d3.format('.2%'),
      paddedYears         = {},
      textLabelMap        = [],
      uiState             = {},
      yearTotals          = {};
      
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
      $popup;

  var width,
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

  // Update treemap data
  this.update = function(_breakdown, _areas, _uiState) {
    // Avoid redundancy
    if (uiState.view === _uiState.view && uiState.year === _uiState.year && uiState.format === _uiState.format)
      return;

    // Setup if view changes
    if (uiState.view !== _uiState.view) {
      breakdown = _breakdown;
      areas     = _areas;
      setupTreemap(_uiState);
    }
    // Update with animation
    else {
      updateTreemap(_uiState);
    }

    return this;
  };

  // Resize treemap
  this.resize = function(){
    // Skip if container width don't change
    if ($(selector).width() === width) return;

    // Set width & height dimensions
    setDimensions();

    // Set treemap dimensions
    setTreemapDimensions();

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
    var id = +d.id;
    nodes.classed('out', function(d) { return getParentId(d) !== id; });

    return this;
  };

  this.areaOut = function() {
    nodes.classed('out', false);

    return this;
  };


  // Setup the treemap
  function setupTreemap(_uiState) {

    // Load the data. We do it here, and not at object creation time, so we have time
    // to change default settings (treemap depth, f.ex.) if needed
    loadBreakdown(breakdown, _uiState.field);

    // Do nothing if there's no data
    if ( !yearTotals[_uiState.year] || !yearTotals[_uiState.year][_uiState.field] )
      return;

    uiState = _uiState;

    setTreemapDimensions();

    // Setup treemap
    treemap = d3.treemap()
      .size([treemapWidth,treemapHeight])
      .padding(0)
      //.tile(d3.treemapBinary)
      //.tile(d3.treemapSquarify.ratio(1))
      //.tile(d3.treemapResquarify) //.ratio(1))
      .round(true);
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
  function updateTreemap(_uiState) {

    /*
    // Do nothing if there's no data
    if ( !yearTotals[_uiState.year] || !yearTotals[_uiState.year][_uiState.field] ) {
      svg.style("opacity", 0);
      return;
    } else {
      svg.style("opacity", 1);
    }
    */

    // Render the treemap
    uiState = _uiState;

    setTreemapDimensions();

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
      .style('visibility', function(d) { return (d.x1-d.x0 === 0) || (d.y1-d.y0 === 0) ? 'hidden' : 'visible'; });
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
      label
        .style('visibility', (label.node().scrollWidth <= nodeWidth && label.node().scrollHeight <= nodeHeight) ? 'visible' : 'hidden');
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
    width       = $(selector).width();
    // Set height based on width container
    if (width > 1000) {
      height = width * 0.5;
    }
    else if (width > 700) {
      height = width * 0.5625;
    }
    else if (width > 500) {
      height = width * 0.75;
    }
    else {
      height = width;
    }
    // Set main element height
    $(selector).height( height );
    // Update font-size scale domain
    fontSizeScale.domain([1, Math.sqrt(width*height) * 0.5]);
  }

  // Adjust the overall treemap size based on the size of this year's budget compared to the biggest ever
  function setTreemapDimensions() {
    var maxValue  = calculateMaxTreemapValueEver();
    var ratio     = Math.sqrt( getValue(yearTotals[uiState.year][uiState.field], uiState.format, uiState.field, uiState.year) / maxValue );
    treemapWidth  = width * ratio;
    treemapHeight = height * ratio;

    // Set nodes container position
    nodesContainer
      .transition()
        .duration(transitionDuration)
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
    // Get a blank dummy child, copy of the given one, to be used for padding (see below)
    function getDummyChild(item) {
      var dummy = {
          id: item.id,
          parentId: 't',
          name: item.name,
      };
      for (var year in columns) {
        dummy[year] = 0;
      }
      return dummy;
    }

    function getChildrenTree(items, level) {
      var children = [];
      for (var id in items) {
        if ($.isEmptyObject(items[id][field])) continue;
        var child = {
          id: id,
          parentId: 't',
          name: items[id].label
        };
        // Get numerical data, 'padding' the tree structure if needed.
        // Padding is needed because the trees/breakdowns need to have the same depth across
        // the years, but our data often has different levels of detail. So we pad.
        var dummy = getDummyChild(child);
        var paddingNeeded = false;
        for (var year in columns) {
          var column_name = columns[year];
          child[year] = items[id][field][column_name] || 0;

          // 'Pad' the current item if its children don't add up to its value.
          if ( child[year] && child.children ) {
            var children_sum = child.children.reduce(function(a,b) { return a+b[year]; }, 0);
            if ( child[year] != children_sum ) {
              paddingNeeded = true;
              paddedYears[year] = true;
              dummy[year] = child[year] - children_sum; // Quite sure children_sum is 0, but just in case
            }
          }
        }
        if ( paddingNeeded )
          child.children.push(dummy);

        children.push(child);
      }
      return children;
    }

    return getChildrenTree(breakdown.sub, 1);
  }

  function loadBreakdown(breakdown, field) {
    // Do nothing if there's no data
    if ( breakdown === null )
      return;

    // Pick the right column for each year: execution preferred over 'just' budget...
    // TODO: This bit is duplicated in BudgetStackedChart
    var columns = {};
    for (var column_name in breakdown.years) {
      var year = breakdown.years[column_name];

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
    // Add root item to treemap data
    treemapData.unshift({id: 't'});
  }

  // Calculate the maximum value of the treemap along the years.
  // Note that we use already calculated 'year totals', which will use _either_ budget or actual
  // spending, not both. This matches the data we use for display. Using both budget and actual
  // would be wrong, although in normal scenarios the difference wouldn't be huge.
  function calculateMaxTreemapValueEver() {
    var maxValue = 0;
    for (var year in yearTotals) {
      maxValue = Math.max(maxValue, getValue(yearTotals[year].income || 0, uiState.format, 'income', year) );
      maxValue = Math.max(maxValue, getValue(yearTotals[year].expense || 0, uiState.format, 'expense', year) );
    }
    return maxValue;
  }


  
  // Helper methods
  function getValue(value, format, field, year) {
    switch (format) {
      case "nominal":
        return value;
      case "real":
        return adjustInflation(value, stats, year);
      case "percentage":
        var total = (field == "expense") ? yearTotals[year].expense : yearTotals[year].income;
        // Avoid division by zero (f.ex. when only one of the sides is available)
        return total > 0 ? value/total : 0;
      case "per_capita":
        var population = getPopulationFigure(stats, year);
        return adjustInflation(value, stats, year) / population;
    }
  }

  function valueFormat(value, uiState) {
    var transformedValue = getValue(value, uiState.format, uiState.field, uiState.year);
    switch (uiState.format) {
      case "nominal":
        return formatAmount(transformedValue);
      case "real":
        return formatAmount(transformedValue);
      case "percentage":
        return formatPercentage(transformedValue);
      case "per_capita":
        return formatDecimalAmount(transformedValue, 2);
    }
  }

  function getParentId(d) {
    return Math.floor(d.id*0.1);
  }

  function isNodeLabelVisible(d){
    return d.x1-d.x0 > labelsMinSize && d.y1-d.y0 > labelsMinSize;
  }
}
