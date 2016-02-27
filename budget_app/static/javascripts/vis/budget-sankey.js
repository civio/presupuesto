function BudgetSankey(theFunctionalBreakdown, theEconomicBreakdown, theStats, theBudgetStatuses, i18n) {

  var functionalBreakdown = theFunctionalBreakdown;
  var economicBreakdown = theEconomicBreakdown;
  var stats = theStats;
  var budgetStatuses = theBudgetStatuses;
  var maxAmountEver = 0;
  var relaxFactor = 0.79;

  var incomeNodes = [];
  var expenseNodes = [];

  var selector;
  var svg;
  var sankey;
  var uiState;
  var $popup = $("#pop-up");
  var color = d3.scale.category20();
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

  this.relaxFactor = function(_) {
    if (!arguments.length) return relaxFactor;
    relaxFactor = _;
    return this;
  };

  this.incomeNodes = function(_) {
    if (!arguments.length) return incomeNodes;
    incomeNodes = _;
    return this;
  }

  this.expenseNodes = function(_) {
    if (!arguments.length) return expenseNodes;
    expenseNodes = _;
    return this;
  }

  this.getSankeyData = function(year) {

    // Check current year actual_ value & update hasExecution variable
    hasExecution = ( functionalBreakdown.years['actual_'+year] ) ? true : false;

    function real(value) {
      return adjustInflation(value, stats, year);
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
      var amounts = { amount: 0, actualAmount: 0 }
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
        return $.extend(amount_info, {label: items[0][labelName], link_id: item_id});

      } else {                              // We got ourselves a hash
        var items = getBreakdownItems(breakdown, item_id.nodes);
        var amount_info = getBreakdownItemsAmounts(items, field);
        return $.extend(amount_info, {label: item_id[labelName], link_id: item_id.nodes});
      }
    }

    function getNodes(breakdown, ids, field, linkGenerator) {
      var nodes = [];
      var accumulatedTotal = 0;
      var accumulatedActualTotal = 0;
      $.each(ids, function(i, id) {
        var item = getNodeInfo(breakdown, id, field);
        if ( item != null ) {
          accumulatedTotal += item.amount;
          accumulatedActualTotal += item.actualAmount;
          nodes.push( { "name": item.label,
                        "value": item.amount,
                        "budgeted": item.amount,
                        "actual": item.actualAmount,
                        "link": linkGenerator(item.link_id, item.label) } );
        }
      });

      // Add an extra node for the remaining amount
      var budgetedRemainder = real(breakdown[field][year]) - accumulatedTotal;
      var actualRemainder = real(breakdown[field]["actual_"+year]) - accumulatedActualTotal;
      if ( budgetedRemainder != 0 )
        nodes.push( { "name": i18n['other'],
                      "value": budgetedRemainder,
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
                          "missingData": node.missingData,
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

    var margin = {top: 1, right: 1, bottom: 25, left: 1},
        width = $(selector).width() - margin.left - margin.right,
        height = ($(selector).width()/2+20) - margin.top - margin.bottom;

    // Set height to selector for IE11
    $(selector).height( height + margin.top + margin.bottom );

    var color = d3.scale.category20();

    svg = d3.select(selector).append("svg")
        // Use viewBox instead width/height to avoid problems in IE11 (https://stackoverflow.com/questions/22250642/d3js-responsive-force-layout-not-working-in-ie-11)
        .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom) )
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    sankey = d3.sankey(width, height)
        .nodeWidth(2)
        .nodePadding(10)
        .relaxFactor(relaxFactor)
        .size([width, height]);
    if ( maxAmountEver != 0 )
      sankey.maxAmountEver(maxAmountEver);

    var path = sankey.link();

    var budget = this.getSankeyData(uiState.year);

    var link = svg.append("g").selectAll(".link")
        .data(budget.links)
      .enter().append("path")
        .call(setupLink)
        .call(setupCallbacks);

    var executionLinks = svg.append("g").selectAll(".link-execution")
        .data(budget.links)
      .enter().append("path")
        .call(setupExecutionLink)
        .call(setupCallbacks);

    var node = svg.append("g").selectAll(".node")
        .data(budget.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("rect")
        .call(setupNodeRect)
        .call(setupCallbacks);

    node.append("text")
        .attr("x", -6)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) { return d.name; })
        .call(setupNodeText)
      .filter(function(d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    // Add a basic legend. Not the most elegant implementation...
    var legend = svg.append('g').attr("transform", "translate(5,"+height+")");
    addLegendItem(legend, 0, i18n['budgeted'], 'legend-budget');
    addLegendItem(legend, 1, i18n['executed'], 'legend-execution');
    var note = svg.append('g').attr("transform", "translate(-10,"+(height+20)+")");
    addLegendItem(note, 0, i18n['amounts.are.real'], 'legend-note');

    updateExecution();
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
      .attr("class", function(d) { return d.missingData ? "link no-data" : "link with-data"; })
      .style("stroke-width", function(d) { return Math.max(1, d.dy); });
  }

  function setupExecutionLink(link) {
    link
      .attr("d", sankey.link())
      .attr("class", function(d) { return d.missingData ? "link-execution no-data" : "link-execution with-data"; })
      .style("display", function(d) { return (d.actual || 0) ? '': 'none'; })
      .style("stroke-width", function(d) { return (d.actual || 0) / d.value * d.dy; });
  }

  function setupNodeRect(rect) {
    rect
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { return d.color = "#666"; })
      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); });
  }

  function setupNodeText(text) {
    text
      .attr("y", function(d) { return d.dy / 2; });
  }
  
  function setupCallbacks() {
    this.on("mouseover", onMouseOver)
        .on("mouseout", onMouseOut)
        .on("mousemove", onMouseMove)
        .on("click", click);
  }

  function onMouseOver(d) {
    d.name ? $popup.find(".popover-title").html(d.name)
           : (d.source.name ? $popup.find(".popover-title").html(d.source.name) : $popup.find(".popover-title").html(d.target.name));

    if ( d.missingData ) {
      $popup.find(".popover-content").html('');
    } else {  // Flow
      // TODO: Display actual income/expense on nodes, not just flows
      $popup.find(".popover-content").html((d.budgeted ? '<span class="budgeted">'+i18n['budgeted']+'</span><br/><span class="popover-content-value">'+formatAmount(d.budgeted)+'</span><br/>' : '') +
                                (d.actual ? '<span class="executed">'+i18n['executed']+'</span><br/><span class="popover-content-value">'+formatAmount(d.actual)+'</span>' : '') );
    }

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