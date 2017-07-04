function BudgetSankey(_functionalBreakdown, _economicBreakdown, adjustInflationFn, _budgetStatuses, i18n) {

  var _this = this,
      functionalBreakdown = _functionalBreakdown,
      economicBreakdown   = _economicBreakdown,
      budgetStatuses      = _budgetStatuses,
      maxAmountEver       = 0,
      nodePadding         = 2,    // Padding between treemap nodes
      centerPadding       = 180,  // Padding between left & right treemaps
      totalsWidth         = 50,   // Total bars width
      totalsHeightRatio   = 0.82, // Total bars height ratio (bars_height/treemaps_height)
      totalsPadding       = 10,   // Padding between total bars
      orderByValue        = true, // Order treemap nodes by value
      transitionDuration  = 650,
      hasExecution        = false,
      initialized         = false,

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

      budget,
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

  this.forceOrder = function(_) {
    if (!arguments.length) return !orderByValue;
    orderByValue = !_;
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
        actual:   (breakdown[field]["actual_"+year] !== undefined) ? real(breakdown[field]["actual_"+year]) : 0,
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
    uiState = _uiState;
    
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
      .attr('transform', getExpensesContTransform);

    incomesCont.append('g').attr('class', 'nodes');
    expensesCont.append('g').attr('class', 'nodes');

    // Get budget data
    budget = this.getFormattedData(uiState.year);

    // Calculate maxAmountEver if not setted
    if (maxAmountEver == 0){
      maxAmountEver = Math.max( budget.incomes[0].actual, budget.incomes[0].budgeted, budget.expenses[0].actual, budget.expenses[0].budgeted );
    }

    // Setup treemap
    treemap = d3.treemap()
      .padding(nodePadding)
      .paddingLeft(0)
      .paddingRight(0)
      .tile(d3.treemapSlice)
      .round(true);

    // Update chart
    updateChart();
    initialized = true;

    d3.select(window).on('resize', _this.resize);
  };

  this.update = function(newUIState) {
    if ( uiState && uiState.year == newUIState.year )
      return; // Do nothing if the year hasn't changed. We don't care about the other fields
    uiState = newUIState;

    budget = this.getFormattedData(uiState.year);

    updateChart();
  };

  this.resize = function(){
    // Avoid redraw when container width keeps the same    
    if( width == $(selector).width() ) return;

    // Set width & height dimensions
    setDimensions();

    // Set svg
    svg.attr('width', width).attr('height', height);

    expensesCont.attr('transform', getExpensesContTransform);

    // set initialized to false before update in order to avoid transition
    initialized = false;
    updateChart();
    initialized = true;

    // TODO!!! Split treemaps in mobile resolutions
  };

  function updateChart(){
    // Show/hide executed labels
    $('.sankey-labels .sankey-label-executed').css('visibility', (hasExecution) ? 'visible' : 'hidden');

    // Set incomes & expenses treemap roots
    incomesRoot = getTreemapRoot(incomesCont, budget.incomes);
    expensesRoot = getTreemapRoot(expensesCont, budget.expenses);

    // update treemap nodes
    setNodes(incomesCont, incomesRoot.leaves());
    setNodes(expensesCont, expensesRoot.leaves());

    // update total bars
    setTotal(incomesCont, incomesRoot.data.budgeted, 'total', 'left');
    setTotal(incomesCont, incomesRoot.data.actual, 'total-executed', 'left');
    setTotal(expensesCont, expensesRoot.data.budgeted, 'total', 'right');
    setTotal(expensesCont, expensesRoot.data.actual, 'total-executed', 'right');

    // Create walls between treemaps & totals bars
    setWall(incomesCont, incomesRoot, 'left');
    setWall(expensesCont, expensesRoot, 'right');
  }

  function getTreemapRoot(cont, budget){

    var heightRatio = Math.max(budget[0].actual, budget[0].budgeted)/maxAmountEver;

    // Setup treemap size based on max budget value / maxAmountEver
    treemap.size([treemapWidth, treemapHeight*heightRatio]);
   
    // Set incomesRoot
    var root = d3.stratify()(budget);
    root
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return (orderByValue) ? b.value - a.value : a.id - b.id; });
    treemap(root);

    // Translate incomes cont
    cont.select('.nodes')
      .transition()
      .duration( initialized ? transitionDuration : 0 )
      .attr('transform', 'translate(0,'+(treemapHeight*(1-heightRatio)|0)+')');

    return root;
  }

  // Create nodes group
  function setNodes(el, data) {
    // DATA JOIN
    var nodes = el.select('.nodes').selectAll('.node').data(data);
    // ENTER + UPDATE
    nodes.enter().append('g')
        .attr('class', 'node')
        .call(setNode)
        .call(setupCallbacks)
      .merge(nodes)
        .transition()
        .duration( initialized ? transitionDuration : 0 )
        .call(updateNode)
        .call(setNodePosition);
    // EXIT
    nodes.exit().remove();
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
      .attr('dy', '.1em')
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
      .call(setNodeTitle);
  }

  function setNodePosition(node) {
    node.attr('transform', function(d){ return 'translate('+d.x0+','+d.y0+')' });
  }

  function setNodeDimensions(node) {
    node
      .attr('y', function(d){ return (1-(d.data.budgeted/d.value))*(d.y1-d.y0) })
      .attr('height', function(d){ return d.data.budgeted/d.value*(d.y1-d.y0) }) //(d.y1-d.y0 > 10) ? d.y1-d.y0 : 1 })
      .attr('width', treemapWidth);
  }

  function setNodeExecutionDimensions(node) {
    // Set height minus 2px & y posision y minus 1px to avoid outline overflows node dimensions
    node
      .attr('x', function(d){ return (d.parent.id == 'income') ? 1 : 0; })
      .attr('y', function(d){ var y = (1-(d.data.actual/d.value))*(d.y1-d.y0), h = d.data.actual/d.value*(d.y1-d.y0); return (h > 2) ? y+1 : y })
      .attr('height', function(d){ var h = d.data.actual/d.value*(d.y1-d.y0); return (h > 2) ? h-2 : h })
      .attr('width', function(d){ return (d.parent.id == 'income') ? treemapWidth : treemapWidth-1; });
  }

  function setNodeTitle(node){
    node
      .attr('x', function(d){ return (d.parent.id == 'income') ? 8 : treemapWidth-8 })
      .attr('y', function(d){ return (d.y1-d.y0)*.5 })
      .style('visibility', function(d){ return (d.y1-d.y0 < 16) ? 'hidden' : 'visible' })
      .style('font-size', getNodeTitleFontSize)
      .text(function(d){ 
        var threshold = (width > 1000) ? 44 : (width > 780) ? 32 : 24;
        return (d.data.name.length-threshold < 3) ? d.data.name : d.data.name.substring(0,threshold)+'...'; 
      });
  }

  // Create totals bars
  function setTotal(cont, budget, name, align) {
    // DATA JOIN
    var total = cont.selectAll('.'+name).data([{'value': budget, 'align': align, 'executed': name == 'total-executed'}]);
    // ENTER + UPDATE
    total.enter().append('rect')
        .attr('class', name)
      .merge(total)
        .transition()
        .duration( initialized ? transitionDuration : 0 )
        .call(setTotalDimensions);
    // EXIT
    total.exit().remove();
  }

  function setTotalDimensions(total) {
    total
      .attr('x', getTotalX)
      .attr('y', getTotalY)
      .attr('height', getTotalHeight)
      .attr('width', totalsWidth );
  }

  // Create wall between treemap & totals bar
  function setWall(cont, data, align) {

    // DATA JOIN
    var wall = cont.selectAll('.wall').data([{'value': Math.max(data.data.actual,data.data.budgeted)/maxAmountEver, 'align': align}]);
    // ENTER + UPDATE
    wall.enter().append('polygon')
        .attr('class', 'wall')
      .merge(wall)
        .transition()
        .duration( initialized ? transitionDuration : 0 )
        .call(setWallDimensions);
    // EXIT
    wall.exit().remove();
  }

  function setWallDimensions(wall) {
    wall
      .attr('transform', function(d){ return (d.align == 'left') ? 'translate('+treemapWidth+',0)' : 'translate(0,0)' })
      .attr('points', function(d){
        var x = (d.align == 'left') ? -totalsWidth+((centerPadding-totalsPadding)*.5) : totalsWidth-((centerPadding-totalsPadding)*.5),
            treemapH = d.value*treemapHeight,
            treemapY = treemapHeight*(1-d.value)|0;
            totalH   = treemapH*totalsHeightRatio,
            totalY   = (treemapHeight*(1-totalsHeightRatio)*.5) + ((1-d.value)*treemapHeight*totalsHeightRatio);
        return [
          [0, treemapY+nodePadding],
          [x, totalY],
          [x, totalY+totalH],
          [0, treemapY+treemapH-nodePadding]];
      });
  }

treemapWidth = (width-centerPadding)*.5;

  function getTotalX(d){
    //var value = (d.align == 'left') ? ((width-totalsPadding)*0.5)-totalsWidth : (totalsPadding-centerPadding)*0.5;
    var value = (d.align != 'left') ? (totalsPadding-centerPadding)*.5 : (height < width) ? ((width-totalsPadding)*.5)-totalsWidth : width-totalsWidth-(totalsPadding*.5);
    return value;
  }
  function getTotalY(d){
    var value = (treemapHeight*(1-totalsHeightRatio)*.5) + ((1-(d.value/maxAmountEver))*treemapHeight*totalsHeightRatio);
    return d.executed ? value+1 : value;
  }
  function getTotalHeight(d) {
    var value = d.value*treemapHeight*totalsHeightRatio/maxAmountEver;
    return d.executed && value > 2 ? value-2 : value;
  }

  function getNodeTitleFontSize(d) {
    var s = ((d.value/d.parent.value)+.35)*38;
    return (s > 10) ? (s|0)+'px' : '10px';
  }

  function getExpensesContTransform(d) {
    return (height < width) ? 'translate('+(treemapWidth+centerPadding)+',0)' : 'translate('+(centerPadding*.5)+','+treemapHeight+')';
  }

  // Set main element dimensions
  function setDimensions() {
    width = $(selector).width();
    // Set height based on width container
    if (width >= 1080) {
      height = width * 0.5;
    }
    else if (width >= 940) {
      height = width * 0.5625;
    }
    else if (width >= 720) {
      height = width * 0.75;
    }
    else {
      height = 2*width;
    }

    if (height < width) {
      treemapWidth = (width-centerPadding)*.5;
      treemapHeight = height;
    } else {
      treemapWidth = width-(centerPadding*.5);
      treemapHeight = height*.5;
    }
    
    // Set height to selector for IE11
    //$(selector).height( height );
  }

  function setupCallbacks(element) {
    element
      .on('mouseover', onMouseOver)
      .on('mouseout',  onMouseOut)
      .on('mousemove', onMouseMove)
      .on('click', click);
  }

  function onMouseOver(d) {
    $popup.find('.popover-title').html( d.data.name);
    var html = d.data.budgeted ? '<span class="budgeted">'+i18n['budgeted']+'</span><br/><span class="popover-content-value">'+Formatter.amount(d.data.budgeted)+'</span><br/>' : '';
    if (hasExecution) {
      html += d.data.actual ? '<span class="executed">'+i18n['executed']+'</span><br/><span class="popover-content-value">'+Formatter.amount(d.data.actual)+'</span>' : '';
    }
    $popup.find('.popover-content').html(html);
    $popup.show();
  }
  
  function onMouseMove(d) {
    var popParentOffset = $(selector).offset(),
        popLeft         = d3.event.pageX - popParentOffset.left - ($popup.width()*.5),
        popBottom       = $(selector).height() - d3.event.pageY + popParentOffset.top + 40;

    popLeft = (popLeft < 0 ) ? 0 : popLeft;
    popLeft = (popLeft+$popup.width() < $('body').width()) ? popLeft : 0;

    $popup.css({'left':popLeft, 'bottom':popBottom});
  }

  function onMouseOut(d) {
    $popup.hide();
  }

  function click(d) {
    if (d.data.link) window.location = d.data.link;
  }
}