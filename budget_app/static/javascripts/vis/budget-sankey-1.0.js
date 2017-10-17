function BudgetSankey(_functionalBreakdown, _economicBreakdown, adjustInflationFn, _budgetStatuses, i18n) {

  var _this = this;
  var functionalBreakdown = _functionalBreakdown;
  var economicBreakdown = _economicBreakdown;
  var budgetStatuses = _budgetStatuses;
  var maxAmountEver = 0;
  var nodePadding = 10;
  var relaxFactor = 0.79;
  var margin = {top: 20, right: 1, bottom: 25, left: 1};

  var incomeNodes = [];
  var expenseNodes = [];

  var selector;
  var svg;
  var sankey;
  var uiState;
  var $popup = $("#pop-up");
  var language = null;

  var transitionLength = 1000;
  var transitionDelay = 100;

  var hasExecution = false;

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

  this.getSankeyData = function(year) {

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
      // Normally we'd start adding from cero, but the Sankey layout seems to get very
      // confused when some elements are zero. What we'll do is have always a tiny
      // minimum amount, and show/hide the element later on based on its value.
      var amounts = { amount: 0.01, actualAmount: 0.01 };
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
      var nodes = [];
      var accumulatedTotal = 0;
      var accumulatedActualTotal = 0;
      $.each(ids, function(i, id) {
        var item = getNodeInfo(breakdown, id, field);
        if ( item !== null ) {
          accumulatedTotal += item.amount;
          accumulatedActualTotal += item.actualAmount;
          nodes.push( { "name": item.label,
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
      var actualRemainder = Math.round( real(breakdown[field]["actual_"+year]) - accumulatedActualTotal );
      if ( budgetedRemainder !== 0 )
        nodes.push( { "name": i18n['other'],
                      "value": Math.max(budgetedRemainder||0, actualRemainder||0),
                      "budgeted": budgetedRemainder,
                      "actual": actualRemainder,
                      "link": linkGenerator(null, null) });

      return nodes;
    }

    function getIncomeNodes() {
      return getNodes(economicBreakdown, incomeNodes, 'income', getIncomeArticleLink);
    }

    function getExpenseNodes() {
      return getNodes(functionalBreakdown, expenseNodes, 'expense', getPolicyLink);
    }

    function addFlow(source, target, node) {
      // TODO: Copying fields like this is ugly
      result.links.push( {"source": source,
                          "target": target,
                          "value": node.value,
                          "budgeted": node.budgeted,
                          "actual": node.actual,
                          "link": node.link} );
    }

    function addSourceFlows(nodes, target) {
      for (var i in nodes) {
        var node_id = result.nodes.length;
        result.nodes[node_id] = nodes[i];
        addFlow(node_id, target, nodes[i]);
      }
    }

    function addTargetFlows(source, nodes) {
      for (var i in nodes) {
        var node_id = result.nodes.length;
        result.nodes[node_id] = nodes[i];
        addFlow(source, node_id, nodes[i]);
      }
    }

    // A general note about the fields for each node:
    //  - 'actual' has the execution information
    //  - 'budgeted' has the budget information
    //  - 'value' is used by the Sankey layout algorithm, and is the budget data when available
    // TODO: Set up value only at the end, automatically
    var result = { "nodes": [], "links": [] };

    result.nodes.push({ "name": '', "budgeted": real(functionalBreakdown.income[year]) });
    var government_id = result.nodes.length-1;
    addSourceFlows(getIncomeNodes(), government_id);
    addTargetFlows(government_id, getExpenseNodes());

    sankey
      .nodes(result.nodes)
      .links(result.links)
      .layout(32);

    return result;
  };

  // Visualize the data with D3
  this.draw = function(theSelector, newUIState) {

    selector = theSelector;
    uiState = newUIState;

    width = $(selector).width() - margin.left - margin.right;
    height = (16*Math.sqrt($(selector).width())) - margin.top - margin.bottom;

    // Set height to selector for IE11
    $(selector).height( height + margin.top + margin.bottom );

    svg = d3.select(selector).select('svg')
        // Use viewBox instead width/height to avoid problems in IE11 (https://stackoverflow.com/questions/22250642/d3js-responsive-force-layout-not-working-in-ie-11)
        .attr("viewBox", "0 0 " + (width+margin.left+margin.right) + " " + (height+margin.top+margin.bottom) )
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    sankey = d3.sankey()
      .nodeWidth(2)
      .nodePadding(nodePadding)
      .relaxFactor(relaxFactor)
      .size([width, height]);

    if (maxAmountEver !== 0)
      sankey.maxAmountEver(maxAmountEver);

    var path = sankey.link();

    var budget = this.getSankeyData(uiState.year);

    // draw links
    link = svg.append("g").selectAll(".link")
        .data(budget.links)
      .enter().append("path")
        .attr("class", "link with-data")
        .call(setupLink)
        .call(setupCallbacks);

    // draw execution links
    svg.append("g").selectAll(".link-execution")
        .data(budget.links)
      .enter().append("path")
        .attr("class", "link-execution with-data")
        .call(setupExecutionLink)
        .call(setupCallbacks);

    // draw nodes
    var node = svg.append("g").selectAll(".node")
        .data(budget.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("rect")
        .attr("class", function(d) { return d.name ? "" : "node-central"; })
        .call(setupNodeRect)
        .call(setupCallbacks);

    node.append("text")
        .attr("dy", ".35em")
        .attr("transform", null)
        .attr("x", function(d) { return (d.sourceLinks.length == 0) ? -6 : 6 + sankey.nodeWidth(); })
        .attr("text-anchor", function(d) { return (d.sourceLinks.length == 0) ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .call(setupNodeText)

    // Add a basic legend. Not the most elegant implementation...
    var legend = svg.append('g').attr("transform", "translate(5,"+height+")");
    addLegendItem(legend, 0, i18n['budgeted'], 'legend-budget');
    addLegendItem(legend, 1, i18n['executed'], 'legend-execution');
    var note = svg.append('g').attr("transform", "translate(-10,"+(height+20)+")");
    if ( i18n['amounts.are.real'] !== undefined )
      addLegendItem(note, 0, i18n['amounts.are.real'], 'legend-note');

    updateExecution();

    d3.select(window).on('resize', _this.resize);
  };

  this.resize = function(){

    // Avoid redraw when container width keeps the same    
    if( width == $(selector).width() - margin.left - margin.right ) return;

    // Remove svg content & redraw svg
    d3.select(selector).select('svg').selectAll('*').remove();
    _this.draw(selector, uiState);
  };

  this.update = function(newUIState) {
    if ( uiState && uiState.year == newUIState.year )
      return; // Do nothing if the year hasn't changed. We don't care about the other fields
    uiState = newUIState;

    var newBudget = this.getSankeyData(uiState.year);

    var nodes = svg.selectAll(".node")
      .data(newBudget.nodes);

    nodes
    .transition().duration(transitionLength).delay(transitionDelay)
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    .select("rect")
      .call(setupNodeRect);

    nodes.select("text")
    .transition().duration(transitionLength).delay(transitionDelay)
      .call(setupNodeText);

    svg.selectAll(".link")
      .data(newBudget.links)
    .transition().duration(transitionLength).delay(transitionDelay)
      .call(setupLink);

    svg.selectAll(".link-execution")
      .data(newBudget.links)
    .transition().duration(transitionLength).delay(transitionDelay)
      .call(setupExecutionLink);

    updateExecution();
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

  function setupLink(link) {
    link
      .attr("d", sankey.link())
      // Hide elements who are practically zero: our workaround for Sankey layout and null elements
      .attr("opacity", function(d) { return ((d.budgeted||0)+(d.actual||0)) > 1 ? 1 : 0; })
      .attr("stroke-width", function(d) { return (d.budgeted || 0) / d.value * d.dy; });
  }

  function setupExecutionLink(link) {
    link
      .attr("d", sankey.link())
      .attr("stroke-width", function(d) { return (d.actual && d.actual > 1) ? d.actual/d.value*d.dy : 0; });
  }

  function setupNodeRect(rect) {
    // We draw the central node differently. To distinguish it we rely on the fact
    // that it's name is ''.
    rect
      .attr("height", function(d) { return d.name ? ((d.budgeted||0) / d.value * d.dy) : d.dy+20; })
      .attr("width", function(d) { return d.name ? sankey.nodeWidth() : 10*sankey.nodeWidth(); })
      .attr("x", function(d) { return d.name ? 0 : -5*sankey.nodeWidth(); })
      .attr("y", function(d) { return d.name ? (1 - (d.budgeted||0) / d.value) * d.dy / 2 : -10; })
      // Hide elements who are practically zero: our workaround for Sankey layout and null elements
      .attr("opacity", function(d) { return ((d.budgeted||0)+(d.actual||0)) > 1 ? 1 : 0; })
  }

  function setupNodeText(text) {
    text
      // Hide elements who are practically zero: our workaround for Sankey layout and null elements
      .attr("opacity", function(d) { return ((d.budgeted||0)+(d.actual||0)) > 1 ? 1 : 0; })
      .attr("y", function(d) { return d.dy / 2; });
  }
  
  function setupCallbacks(element) {
    element
      .on("mouseover", onMouseOver)
      .on("mouseout", onMouseOut)
      .on("mousemove", onMouseMove)
      .on("click", click);
  }

  function onMouseOver(d) {
    if (d.name === '')   // Central node, nothing to do
      return;

    var name = d.name ? d.name : (d.source.name ? d.source.name : d.target.name);
    $popup.find(".popover-title").html(name);

    var html = '';
    if (hasExecution) {
      html += d.actual ? '<span class="executed">'+i18n['executed']+'</span><span class="popover-content-value popover-content-executed">'+Formatter.amount(d.actual)+'</span>' : '';
    }
    html += d.budgeted ? '<span class="budgeted">'+i18n['budgeted']+'</span><span class="popover-content-value popover-content-budgeted">'+Formatter.amount(d.budgeted)+'</span>' : '';
    $popup.find('.popover-content').html(html);
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