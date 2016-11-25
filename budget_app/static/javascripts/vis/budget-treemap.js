//function BudgetTreemap(selector, breakdown, stats, areas, aspectRatio, colors, labelsMinSize) {
function BudgetTreemap(_selector, _stats, _aspectRatio, _colors, _labelsMinSize, _i18n, _budgetStatuses) {

  var selector            = _selector,
      stats               = _stats,
      aspectRatio         = (_aspectRatio) ? _aspectRatio : 1;        // Treemap aspect ratio
      labelsMinSize       = (_labelsMinSize) ? _labelsMinSize : 70,   // Minimum node size in px (width or height) to add a label
      i18n                = (_i18n) ? _i18n : [],
      budgetStatuses      = (_budgetStatuses) ? _budgetStatuses : {};

  var areas               = null,
      breakdown           = null,
      formatPercent       = d3.format('.2%'),
      maxLevels           = -1,   // By default, don't limit treemap depth
      maxTreemapValueEver = 0,
      mouseOver           = true,
      labelsFontSizeMin   = 11,   // Nodes label minimum size in px
      labelsFontSizeMax   = 65,   // Nodes label maximum size in px
      nodesPadding        = 5,    // Define padding of nodes label container
      paddedYears         = {},
      textLabelMap        = [],
      treemapData         = null,
      treemapItems        = null,
      transitionDuration  = 650,
      uiState             = {},
      yearTotals          = {};
      
  var width,
      height,
      treemapWidth,
      treemapHeight,
      colorScale,
      fontSizeScale,
      nodesContainer,
      nodes,
      treemap,
      treemapRoot,
      $popup;

  // colors array: use D3 category10 colors as starting point
  var colors  = (_colors && _colors.length > 0) ?
                _colors :
                [ "#A9A69F", "#D3C488", "#2BA9A0", "#E8A063", "#9EBF7B", "#dbb0c0", "#7d8f69", "#a29ac8", "#6c6592", "#9e9674", "#e377c2", "#e7969c", "#bcbd22", "#17becf"];



  // Getters/setters
  this.initialized = function() {
    return treemap !== null;
  };

  // TODO!!! Check if we need this setters
  this.i18n = function(_) {
    if (!arguments.length) return _;
    i18n = _;
    return this;
  };

  this.budgetStatuses = function(_) {
    if (!arguments.length) return _;
    budgetStatuses = _;
    return this;
  };

  this.colors = function(_) {
    if (!arguments.length) return colors;
    colors = _;
    setColorScale();
    return this;
  };

  this.maxLevels = function(_) {
    if (!arguments.length) return maxLevels;
    maxLevels = _;
    return this;
  };

  this.maxTreemapValueEver = function(_) {
    if (!arguments.length) return maxTreemapValueEver;
    maxTreemapValueEver = _;
    return this;
  };

  this.mouseOver = function(_) {
    if (!arguments.length) return mouseOver;
    mouseOver = _;
    return this;
  };

  this.areaOver = function(d) {
    var id = d.id;
    nodes.classed('out', function(d) { return getParentId(d) !== id; });
  };

  this.areaOut = function() {
    nodes.classed('out', false);
  };
  
  
  // Initialization at object creation time
  setup();

  // Setup SVG items on 
  function setup() {
    console.log('seetup');

    // Set popoup element
    $popup = $(selector+' .popover');

    // Setup color scale
    setColorScale();

    // Setup font-size scale (power of two scale)
    fontSizeScale = d3.scalePow()
      .exponent(2)
      .range([labelsFontSizeMin, labelsFontSizeMax])
      .clamp(true);

    // Set width & height dimensions
    setDimensions();

    // Setup nodes container
    nodesContainer = d3.select(selector)
      .append('div')
        .attr('class', 'nodes-container');
  }

  // Set colors scale based on colors array
  function setColorScale() {
    colorScale = d3.scaleOrdinal()
      .range(colors)
      .domain([0,1,2,3,4,5,6,7,8,9]);
  }

  // Set main element dimensions
  function setDimensions() {
    width       = $(selector).width();
    height      = width / aspectRatio;
    // Set main element height
    $(selector).height( height );
    // Update font-size scale domain
    fontSizeScale.domain([1, Math.sqrt(width*height)*0.5]);
  }

  // Adjust the overall treemap size based on the size of this year's budget compared to the biggest ever
  function setTreemapDimensions() {
    var maxValue  = maxTreemapValueEver || calculateMaxTreemapValueEver();
    var ratio     = Math.sqrt( getValue(yearTotals[uiState.year][uiState.field], uiState.format, uiState.field, uiState.year) / maxValue );
    treemapWidth  = (width * ratio);
    treemapHeight = (height * ratio);

    // Setup nodes container dimensions
    nodesContainer
      .style('width',  treemapWidth+'px')
      .style('height', treemapHeight+'px')
      .transition()
        .duration(transitionDuration)
        .style('top',    (height-treemapHeight)/2+'px')
        .style('left',   (width-treemapWidth)/2+'px');
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
          //leaf: true
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
          //leaf: true
        };
        // Get children, recursively
        if ( maxLevels==-1 || level<maxLevels ) {
          if (items[id].sub) {
            child.leaf = false;
            child.children = getChildrenTree(items[id].sub, level+1);
          }
        }
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

    /*
    return {
      name: field,
      children: getChildrenTree(breakdown.sub, 1)
    };
    */

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


  // Update treemap
  this.update = function(_breakdown, _areas, _uiState) {
    // Avoid redundancy
    if (uiState.view === _uiState.view && uiState.year === _uiState.year && uiState.format === _uiState.format)
      return;

    // Setup
    if (uiState.view !== _uiState.view) {
      breakdown = _breakdown;
      areas     = _areas;
      this.setupTreemap(_uiState);
    }
    // Update
    else {
      this.updateTreemap(_uiState);
    }
  };


  // Initialize and display the treemap, using a fade-in animation.
  this.setupTreemap = function(_uiState) {

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
  };

  // Update the year or format of a treemap.
  // Note: you can't change the field being displayed, i.e. expense vs. income.
  this.updateTreemap = function(_uiState) {
    // Do nothing before initialization
    if ( treemap === null ) return;

    /*
    // Do nothing if there's no data
    if ( !yearTotals[_uiState.year] || !yearTotals[_uiState.year][_uiState.field] ) {
      svg.style("opacity", 0);
      return;
    } else {
      svg.style("opacity", 1);
    }
    */

    /*
    // We prefer the 'sticky' layout in the treemap, but it needs to have a consistent data structure
    // across the years. (One item more or less is bearable, but a whole level appearing breaks
    // the layout: the new items get displayed along only one dimension.) So we disable the
    // 'stickyness' when we move between years with different levels of detail.
    if ( uiState.year != _uiState.year ) {
      var shouldBeSticky = (paddedYears[uiState.year] == paddedYears[_uiState.year]);
      // Resetting sticky to true resets the treemap internal cache; we don't want that, so check.
      // See https://github.com/mbostock/d3/wiki/Treemap-Layout#wiki-sticky
      if ( treemap.sticky() != shouldBeSticky )
        treemap.sticky(shouldBeSticky);
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

    console.log('update treemap!');

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
      // !!! TODO!!! -> Take care of padding & visibility of initially very small nodes
      .on('end', function(d,i) {
        if (i == nodes.size()-1) {
          console.log('transition end', i, nodes.size()-1);
          // Filter nodes with labels visibles (based on labelsMinSize) & set its label
          nodes.filter(isNodeLabelVisible)
            .call(setNodeLabel);
        }
      })
      .call(setNodeTransition);
  };

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
    var node,
        nodeWidth,
        nodeHeight,
        nodeArea,
        textWidth,
        size;

    // Resize item function
    function resizeItem(){
      size--;
      //console.log(d.data.name, size, item.node().scrollWidth, nodeWidth );
      node.style('font-size', size+'px');
    }

    // loop throught each item
    selection.each( function(d){
      node       = d3.select(this);
      nodeWidth  = d.x1-d.x0;
      nodeHeight = d.y1-d.y0;
      nodeArea   = Math.sqrt(nodeWidth * nodeHeight);
      size       = Math.round(fontSizeScale(nodeArea));  // Set font size based on node area

      // Set node font-size based on its are
      node.style('font-size', size+'px');

      // Decrease font-size until text fits node width
      while (node.node().scrollWidth > nodeWidth && size > labelsFontSizeMin) {
        resizeItem();
      }
      // Decrease font-size until text fits node height
      while (node.node().scrollHeight > nodeHeight && size > labelsFontSizeMin) {
        resizeItem();
      }
      
      // Hide node label if doesn't fit node width or height
      node.select('.node-label')
        .style('visibility', (node.node().scrollWidth <= nodeWidth && node.node().scrollHeight <= nodeHeight) ? 'visible' : 'hidden');
    });
  }

  function _(s) {
    return i18n[s] || s;
  }
  
  function onNodeOver(d) {
    if (!mouseOver) return;
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
    if (!mouseOver) return;
    var popParentOffset = $(selector).offset();
    var popLeft         = d3.event.pageX - popParentOffset.left - $popup.width()/2;
    var popBottom       = $(selector).height() - d3.event.pageY + popParentOffset.top + 15;
    $popup.css({'left':popLeft, 'bottom':popBottom});
  }
  
  function onNodeOut(d) {
    if (!mouseOver) return;
    nodes.classed('out', false);
    $popup.hide();
  }

  function onNodeClick(d) {
    $(selector).trigger('policy-selected', d.data);
  }
  
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
