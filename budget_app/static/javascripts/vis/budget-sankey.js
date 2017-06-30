function BudgetSankey(_functionalBreakdown, _economicBreakdown, adjustInflationFn, _budgetStatuses, i18n) {

  var _this = this,
      functionalBreakdown = _functionalBreakdown,
      economicBreakdown   = _economicBreakdown,
      budgetStatuses      = _budgetStatuses,
      margin              = {top: 20, right: 1, bottom: 25, left: 1},  // ?
      maxAmountEver       = 0,
      nodePadding         = 4,    // Padding between treemap nodes
      centerPadding       = 180,  // Padding between left & right treemaps
      totalsWidth         = 50,   // Total bars width
      totalsHeightRatio   = 0.82, // Total bars height ratio (bars_height/treemaps_height)
      totalsPadding       = 10,   // Padding between total bars
      orderByValue        = true, // Order treemap nodes by value
      transitionLength    = 1000,
      transitionDelay     = 100,
      hasExecution        = false,

      selector,
      svg,
      incomesCont,
      expensesCont,
      treemap,
      incomesRoot,
      expensesRoot,

      width,
      height,
      treemapWidth,
      treemapHeight,

      incomeNodes = [],
      expenseNodes = [],

      uiState,
      $popup = $("#pop-up"),
      language = null;


  this.language = function(_) {
    if (!arguments.length) return language;
    language = _;
    return this;
  };

  this.maxAmountEver = function(_) {
    if (!arguments.length) return maxAmountEver;
    maxAmountEver = _;
    return this;
  };

  this.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = _;
    return this;
  };

  this.relaxFactor = function(_) {
    if (!arguments.length) return relaxFactor;
    relaxFactor = _;
    return this;
  };

  this.incomeNodes = function(_) {
    if (!arguments.length) return incomeNodes;
    incomeNodes = _;
    return this;
  };

  this.expenseNodes = function(_) {
    if (!arguments.length) return expenseNodes;
    expenseNodes = _;
    return this;
  };

  this.getFormattedData = function(year) {

    // Check current year actual_ value & update hasExecution variable
    hasExecution = ( functionalBreakdown.years['actual_'+year] ) ? true : false;

    function real(value) {
      return adjustInflationFn(value, year);
    }

    // Given an array of item ids, return an array of breakdown items. An item id
    // can be a two-element array, i.e. [article id, concept id].
    // For backwards compatibility, a string with one article id is also accepted as input.
    function getBreakdownItems(breakdown, item_ids) {
      if ( typeof item_ids == 'string' ) {      // Standard, an id
        return [ breakdown.sub[item_ids] ];
      } else {                                  // We got ourselves a hash
        return _.map(item_ids, function(item) {
          if ( typeof item == 'string' ) {      // Standard, an article id
            return breakdown.sub[item];
          } else {                              // A two-element array, a concept id
            return breakdown.sub[item[0]].sub[item[1]];
          }
        });
      }
    }

    // Retrieve amount information for a given id
    function getBreakdownItemsAmounts(items, field) {
      var amounts = { amount: 0, actualAmount: 0 };
      $.each(items, function(i, item) {
        amounts.amount += real(item[field][year]||0);
        amounts.actualAmount += real(item[field]["actual_"+year]||0);
      });
      return amounts;
    }

    // Retrieve information for a given id. We support two formats:
    //   - simple: a string with an article id
    //   - advanced: a hash with 'nodes' and 'label' for custom behaviours.
    // We also support the hash node ids to be an array to traverse the tree.
    // (I initially thought I'd be smart and guess the path automatically, but
    // this way I don't have to be smart and make assumptions, always dangerous.)
    function getNodeInfo(breakdown, item_id, field) {
      var labelName = language ? 'label.'+language : 'label';

      if ( typeof item_id == 'string' ) {   // Standard, an id
        var items = getBreakdownItems(breakdown, item_id);
        var amount_info = getBreakdownItemsAmounts(items, field);
        return $.extend(amount_info, {label: items[0].label, link_id: item_id});

      } else {                              // We got ourselves a hash
        var items = getBreakdownItems(breakdown, item_id.nodes);
        var amount_info = getBreakdownItemsAmounts(items, field);
        var link_id = item_id['link_id']===undefined ? item_id.nodes : item_id['link_id'];
        return $.extend(amount_info, {label: item_id[labelName], link_id: link_id});
      }
    }

    function getNodes(breakdown, ids, field, linkGenerator) {
      var nodes = [{
        id:       field,
        actual:   real(breakdown[field]["actual_"+year]),
        budgeted: real(breakdown[field][year])
      }];
      var accumulatedTotal = 0;
      var accumulatedActualTotal = 0;
      $.each(ids, function(i, id) {
        var item = getNodeInfo(breakdown, id, field);
        if ( item !== null ) {
          accumulatedTotal += item.amount;
          accumulatedActualTotal += item.actualAmount;
          nodes.push( { "id": ""+i,
                        "parentId": field,
                        "name": item.label,
                        // We need to layout the money flows using whatever is bigger:
                        // the budget or the actual figures. Otherwise flows would overlap.
                        "value": Math.max(item.amount||0, item.actualAmount||0),
                        "budgeted": item.amount,
                        "actual": item.actualAmount,
                        "link": linkGenerator(item.link_id, item.label) } );
        }
      });

      // Add an extra node for the remaining amount.
      // We round the amounts because accumulated rounding errors can, in some cases,
      // produce a node with an infinitesimal negative amount, which makes the viz crazy.
      var budgetedRemainder = Math.round( real(breakdown[field][year]) - accumulatedTotal );
      var actualRemainder = (hasExecution) ? Math.round( real(breakdown[field]["actual_"+year]) - accumulatedActualTotal ) : 0;
      if ( budgetedRemainder !== 0 ) {
        nodes.push( { "id": "100",
                      "parentId": field,
                      "name": i18n['other'],
                      "value": Math.max(budgetedRemainder||0, actualRemainder||0),
                      "budgeted": budgetedRemainder,
                      "actual": actualRemainder,
                      "link": linkGenerator(null, null) });
      }

      console.log(nodes);

      return nodes;
    }

    // A general note about the fields for each node:
    //  - 'actual' has the execution information
    //  - 'budgeted' has the budget information
    //  - 'value' is used by the Treemap layout algorithm, and is the budget data when available
    // TODO: Set up value only at the end, automatically
    var result = {};
    result.incomes  = getNodes(economicBreakdown, incomeNodes, 'income', getIncomeArticleLink);
    result.expenses = getNodes(functionalBreakdown, expenseNodes, 'expense', getPolicyLink);

    return result;
  };

  // Visualize the data with D3
  this.draw = function(_selector, _uiState) {

    selector = _selector;
    uiState  = _uiState;

    // Set width & height dimensions
    setDimensions();

    // Set svg
    svg = d3.select(selector).select('svg')
      .attr('width', width)
      .attr('height', height);
      /*
      // Use viewBox instead width/height to avoid problems in IE11 (https://stackoverflow.com/questions/22250642/d3js-responsive-force-layout-not-working-in-ie-11)
        .attr("viewBox", "0 0 " + (width+margin.left+margin.right) + " " + (height+margin.top+margin.bottom) )
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      */

    // Setup incomes & expenses containers
    incomesCont  = svg.append('g')
      .attr('class', 'incomes');
    expensesCont = svg.append('g')
      .attr('class', 'expenses')
      .attr('transform', 'translate('+(treemapWidth+centerPadding)+',0)');

    // Get data
    var budget = this.getFormattedData(uiState.year);

    // Calculate maxAmountEver if not setted
    if (maxAmountEver == 0){
      maxAmountEver = Math.max( budget.incomes[0].actual, budget.incomes[0].budgeted, budget.expenses[0].actual, budget.expenses[0].budgeted );
    }

    // Setup treemap
    treemap = d3.treemap()
      .size([treemapWidth, treemapHeight])
      .padding(nodePadding)
      .paddingLeft(0)
      .paddingRight(0)
      .tile(d3.treemapSlice)
      .round(true);

    // set incomes & expenses treemap roots
    setTreemapRoots(budget);

    // Create treemap nodes
    setNodes(incomesCont, incomesRoot.leaves());
    setNodes(expensesCont, expensesRoot.leaves());

    // Create total bars
    //setTotal(incomesCont, incomesRoot.data.actual, incomesRoot.data.budgeted, 'left');
    //setTotal(expensesCont, expensesRoot.data.actual, expensesRoot.data.budgeted, 'right');

    /*
    // Create walls between treemaps & totals bars
    setWall(incomesCont, incomesRoot.value, 'left');
    setWall(expensesCont, expensesRoot.value, 'right');
    */

    // Add a basic legend. Not the most elegant implementation...
    var legend = svg.append('g').attr("transform", "translate(5,"+height+")");
    addLegendItem(legend, 0, i18n['budgeted'], 'legend-budget');
    addLegendItem(legend, 1, i18n['executed'], 'legend-execution');
    var note = svg.append('g').attr("transform", "translate(-10,"+(height+20)+")");
    if ( i18n['amounts.are.real'] !== undefined )
      addLegendItem(note, 0, i18n['amounts.are.real'], 'legend-note');

    updateExecution();  // Remove this!?

    d3.select(window).on('resize', _this.resize);
  };

  this.update = function(newUIState) {
    if ( uiState && uiState.year == newUIState.year )
      return; // Do nothing if the year hasn't changed. We don't care about the other fields
    uiState = newUIState;

    console.log(uiState.year);

    var budget = this.getFormattedData(uiState.year);

    // Update tremap size
    treemap.size([treemapWidth, treemapHeight]);

    // Set incomes & expenses treemap roots
    setTreemapRoots(budget);

    // Create treemap nodes
    setNodes(incomesCont, incomesRoot.leaves());
    setNodes(expensesCont, expensesRoot.leaves());

    updateExecution();   // Remove this!?
  };

  this.resize = function(){
  
    // Avoid redraw when container width keeps the same    
    if( width == $(selector).width() - margin.left - margin.right ) return;

    // Remove svg & redraw
    d3.select(selector).select("svg").remove();
    _this.draw(selector, uiState);
  };

  function updateExecution(){
    // Hide or show 'legend-execution' based on hasExecution variable
    var visibility = ( hasExecution ) ? 'visible' : 'hidden';
    d3.select('.legend-execution').style('visibility', visibility );

    // Update execution text based on budgetStatuses
    if (hasExecution && budgetStatuses) {
      var txt = i18n['executed'];
      if(budgetStatuses[uiState.year] && budgetStatuses[uiState.year] !== ''){
        txt += ' '+i18n[budgetStatuses[uiState.year]];
      }
      d3.select('.legend-execution text').text( txt );
    }
  }

  function addLegendItem(legend, i, text, cssClass) {
    var g = legend.append('g')
      .attr("class", 'legend-item '+cssClass)
      .attr("transform", "translate("+i*150+",0)");
    g.append("circle")
      .attr("r", "5");
    g.append("text")
      .attr("text-anchor", "start")
      .attr("x", 10)
      .attr("dy", ".32em")
      .text(text);
  }

  function setTreemapRoots(budget){
    // Set incomesRoot
    incomesRoot = d3.stratify()(budget.incomes);
    incomesRoot
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return (orderByValue) ? b.value - a.value : b.i - a.i; });
    treemap(incomesRoot);

    // Set expensesRoot
    expensesRoot = d3.stratify()(budget.expenses);
    expensesRoot
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return (orderByValue) ? b.value - a.value : b.i - a.i; });
    treemap(expensesRoot);

    console.log(incomesRoot.leaves());
  }

  // Create nodes group
  function setNodes(el, data) {
    // DATA JOIN
    // Join new data with old elements, if any.
    var nodes = el.selectAll('.node').data(data);
    // ENTER
    // Create new elements as needed.
    //
    // ENTER + UPDATE
    // After merging the entered elements with the update selection,
    // apply operations to both.
    nodes.enter().append('g')
        .attr('class', 'node')
        .call(setNode)
      .merge(nodes)
        .call(updateNode)
        .call(setNodePosition);
    // EXIT
    // Remove old elements as needed.
    nodes.exit().remove()
  }

  // Setup nodes budgeted, executed & title
  function setNode(node) {
    // add budget rect
    node.append('rect')
      .attr('class', 'node-budget');
    // add execution rect
    node.append('rect')
      .attr('class', 'node-executed');
    // add title
    node.append('text')
      .attr('class', 'node-title')
      .attr('dy', '-.5em')
      .attr('x', function(d){ return (d.parent.id == 'income') ? 8 : treemapWidth-8 })
      .attr('text-anchor', function(d){ return (d.parent.id == 'income') ? 'start' : 'end' });
  }

  // Update nodes budgeted, executed & title
  function updateNode(node) {
    // add budget rect
    node.select('.node-budget')
      .call(setNodeDimensions);
    // add execution rect
    node.select('.node-executed')
      .call(setNodeExecutionDimensions);
    // add title
    node.select('.node-title')
      .call(setNodeTitle)
      .each(wrapText);
  }

  function setNodePosition(node) {
    node.attr('transform', function(d){ return 'translate('+d.x0+','+d.y0+')' });
  }

  function setNodeDimensions(node) {
    console.log('setNodeDimensions', node, node.datum());
    node
      .attr('y', function(d){ return (1-(d.data.budgeted/d.value))*(d.y1-d.y0) })
      .attr('height', function(d){ console.log(d.id,d.value); return d.data.budgeted/d.value*(d.y1-d.y0) }) //(d.y1-d.y0 > 10) ? d.y1-d.y0 : 1 })
      .attr('width', treemapWidth);
  }

  function setNodeExecutionDimensions(node) {
    // Set height minus 2px & y posisiont minus 1px to avoid outline overflows node dimensions
    node
      .attr('x', 1)
      .attr('y', function(d){ var y = (1-(d.data.actual/d.value))*(d.y1-d.y0), h = d.data.actual/d.value*(d.y1-d.y0); return (h > 2) ? y+1 : y })
      .attr('height', function(d){ var h = d.data.actual/d.value*(d.y1-d.y0); return (h > 2) ? h-2 : h })
      .attr('width', treemapWidth-2);
  }

  function setNodeTitle(node){
    node
      .attr('y', function(d){ return d.y1-d.y0 })
      .style('visibility', function(d){ return (d.y1-d.y0 > 18) ? 'visible' : 'hidden' })
      .style('font-size', getNodeTitleFontSize)
      .text(function(d){ return d.data.name });
  }

  // Create totals bars
  function setTotal(cont, executed, budgeted, align) {
    cont.selectAll('.total')
      .data([{'value': budgeted, 'align': align}])
      .enter().append('rect')
        .attr('class', 'total')
        .call(setTotalDimensions);
    // set total execution
    cont.selectAll('.total-executed')
      .data([{'value': executed, 'align': align}])
      .enter().append('rect')
        .attr('class', 'total-executed');
  }

  function setTotalDimensions(total) {
    total
      .attr('x', function(d){ return (d.align == 'left') ? ((width-totalsPadding)*0.5)-totalsWidth : (totalsPadding-centerPadding)*0.5 })
      .attr('y', function(d){ return (d.align == 'left') ? getTotalOffset() : getTotalExecutedOffset() })
      .attr('height', function(d){ return (d.align == 'left') ? getTotalHeight() : getTotalExecutedHeight() })
      .attr('width', totalsWidth);
  }

  function setTotalExecutedDimensions(total) {
    total
      .attr('x', function(d){ return (d.align == 'left') ? ((width-totalsPadding)*0.5)-totalsWidth : (totalsPadding-centerPadding)*0.5 })
      .attr('y', function(d){ return (d.align == 'left') ?  getTotalOffset()+((1-r)*getTotalHeight()) : getTotalExecutedOffset()+((1-r)*getTotalExecutedHeight()) })
      .attr('height', function(d){ return (d.align == 'left') ? r*getTotalHeight() : r*getTotalExecutedHeight() })
      .attr('width', totalsWidth);
  }

  // Create wall between treemap & totals bar
  function setWall(cont, data, align) {
    cont.selectAll('.wall')
      .data([{'value': data, 'align': align}])
      .enter().append('polygon')
        .attr('class', 'wall')
        .call(setWallDimensions);
  }

  function setWallDimensions(wall) {
    wall
      .attr('transform', function(d){ return (d.align == 'left') ? 'translate('+treemapWidth+',0)' : 'translate(0,0)' })
      .attr('points', function(d){ return (d.align == 'left') ?
        [[0,5], [((centerPadding-totalsPadding)*.5)-totalsWidth,height*(1-totalsHeightRatio)*.5], [((centerPadding-totalsPadding)*.5)-totalsWidth,height*(1+totalsHeightRatio)*.5], [0,height-5], [0,5]] : 
        [[0,5], [totalsWidth-((centerPadding-totalsPadding)*.5),height*(1.1-totalsHeightRatio)*.5], [totalsWidth-((centerPadding-totalsPadding)*.5),height*(1+totalsHeightRatio)*.5], [0,height-5], [0,5]] });
        //[[0,5], [((centerPadding-totalsPadding)*.5)-totalsWidth,-50], [((centerPadding-totalsPadding)*.5)-totalsWidth,height-60], [0,height-5], [0,5]] : 
        //[[0,5], [totalsWidth-((centerPadding-totalsPadding)*.5),-50], [totalsWidth-((centerPadding-totalsPadding)*.5),height-60], [0,height-5], [0,5]] });
  }

  function getTotalHeight() {
    return height*totalsHeightRatio;
  }
  function getTotalOffset() {
    return height*(1-totalsHeightRatio)*.5;
  }
  function getTotalExecutedHeight() {
    return height*(totalsHeightRatio-.05);
  }
  function getTotalExecutedOffset() {
    return height*(1.1-totalsHeightRatio)*.5;
  }

  function getNodeTitleFontSize(d) {
    var s = ((d.value/d.parent.value)+.4)*30;
    return (s > 10) ? s : 10;
  }

  function wrapText() {
    var el = d3.select(this),
        length = el.node().getComputedTextLength(),
        text = el.text();
    //console.log('wrapText', el, length, text);
    while (length > treemapWidth-50 && text.length > 0) {
      text = text.slice(0, -1);
      el.text(text + '...');
      length = el.node().getComputedTextLength();
    }
  }
  
  function setupCallbacks(element) {
    element
      .on("mouseover", onMouseOver)
      .on("mouseout", onMouseOut)
      .on("mousemove", onMouseMove)
      .on("click", click);
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
    else if (width > 640) {
      height = width * 0.75;
    }
    else {
      height = width;
    }
    treemapWidth = (width-centerPadding) * 0.5;
    treemapHeight = height;
    /*
    var ratio     = Math.sqrt( getValue(yearTotals[uiState.year][uiState.field], uiState.format, uiState.field, uiState.year) / maxValue );
    treemapHeight = height * ratio;
    */

    // Set height to selector for IE11
    //$(selector).height( height );
  }

  function onMouseOver(d) {
    if (d.name === '')   // Central node, nothing to do
      return;

    var name = d.name ? d.name : (d.source.name ? d.source.name : d.target.name);
    $popup.find(".popover-title").html(name);

    var html = d.budgeted ? '<span class="budgeted">'+i18n['budgeted']+'</span><br/><span class="popover-content-value">'+Formatter.amount(d.budgeted)+'</span><br/>' : '';
    if ( hasExecution )
      html += d.actual ? '<span class="executed">'+i18n['executed']+'</span><br/><span class="popover-content-value">'+Formatter.amount(d.actual)+'</span>' : '';
    $popup.find(".popover-content").html(html);
    $popup.show();
  }
  
  function onMouseMove(d) {
    var popParentOffset = $(selector).offset();
    var popLeft         = d3.event.pageX - popParentOffset.left - $popup.width()/2;
    var popBottom       = $(selector).height() - d3.event.pageY + popParentOffset.top + 15;

    popLeft = (popLeft < 0 ) ? 0 : popLeft;
    popLeft = (popLeft+$popup.width() < $('body').width()) ? popLeft : 0;

    $popup.css({"left":popLeft, "bottom":popBottom});
  }

  function onMouseOut(d) {
    $popup.hide();
  }

  function click(d) {
    if ( d.link )  window.location = d.link;
  }
}