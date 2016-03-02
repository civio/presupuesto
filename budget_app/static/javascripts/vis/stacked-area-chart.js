function StackedAreaChart() {

  var _this = this;

  _this.currentYear = null;

  _this.margin  = {top: 20, right: 20, bottom: 30, left: 80};
 
  _this.x = d3.scale.linear();
  _this.y = d3.scale.linear();

  _this.line = d3.svg.line()
    .x(function(d,i){ return _this.x(d.x); })
    .y(function(d){ return _this.y(d.y0+d.y); });

  _this.color = d3.scale.category10();

  _this.xAxis = d3.svg.axis()
      .scale(_this.x)
      .tickPadding(10)
      .orient('bottom')
      .tickSize(0);

  _this.yAxis = d3.svg.axis()
      .scale(_this.y)
      .tickPadding(6)
      .orient('left')
      .ticks(4);

  _this.area = d3.svg.area()
      .x(function(d) { return _this.x(d.x); })
      .y0(function(d) { return _this.y(d.y0); })
      .y1(function(d) { return _this.y(d.y0 + d.y); });

  _this.stack = d3.layout.stack()
      .values(function(d) { return d.values; });

  _this.dataFormat = null;

  _this.percentageFormat = d3.format('+.1f'); // used in popover percentage variation


  // Setup SVG Object
  _this.setup = function(selector){

    console.log('setup stacked chart', selector);

    _this.selector = selector;

    // Remove charts previously created
    if( $(selector+' .stacked-area-chart').size() > 0 ){
      $(selector+' .stacked-area-chart').remove();
      $(selector+' .stacked-area-chart-legend').remove();
    }

    // Add legend
    _this.legend = d3.select(selector).append('div')
      .attr('class', 'stacked-area-chart-legend');

    // Setup Popover
    _this.$popover = $(selector).find('.popover');

    // Add SVG
    _this.svg = d3.select(selector).append('svg')
        .attr('class', 'stacked-area-chart')
      .append('g')
        .attr('transform', 'translate(' + _this.margin.left + ',' + _this.margin.top + ')');

    // Set dimensions & add resize event
    setDimensions();
    d3.select(window).on('resize', _this.resize);

    return _this;
  };

  // Set Dimensions
  var setDimensions = function(){
    // Setup width & height based on container
    _this.width   = $(_this.selector).width() - _this.margin.left - _this.margin.right;
    _this.height  = 0.5*$(_this.selector).width() - _this.margin.top - _this.margin.bottom;

    // Setup SVG dimensions
    d3.select(_this.selector+' .stacked-area-chart')
      .attr('width', _this.width + _this.margin.left + _this.margin.right)
      .attr('height', _this.height + _this.margin.top + _this.margin.bottom);

    // Setup X & Y scale range
    _this.x.range([0, _this.width]);
    _this.y.range([_this.height, 0]);

    _this.yAxis.tickSize(-_this.width);

    // Set X section width
    _this.xSectionWidth = _this.width /( _this.x.domain()[1] - _this.x.domain()[0] );
  };

  // Resize Event Handler
  _this.resize = function(){
    
    if( parseInt(_this.svg.attr('width')) === $(_this.selector).width() ) return;

    setDimensions();
    _this.update(0);

    // Update Axis
    _this.svg.select('.x.axis')
      .attr('transform', 'translate(0,' + _this.height + ')')
      .call(_this.xAxis);

    _this.svg.select('.y.axis')
      .call(_this.yAxis);

    // Update background rect
    _this.svg.select('.bkg-rect')
      .attr('width', _this.width)
      .attr('height', _this.height);

    // Update nonexecuted overlay if exists
    if( _this.budgetExecutionLastYear !== null ){
      var budgetExecutionLastYearWidth = _this.years[_this.years.length-1] - (_this.years[_this.budgetExecutionLastYear]-1);
      _this.nonexecutedOverlay.select('rect')
        .attr('height', _this.height)
        .attr('width', _this.x(_this.years[budgetExecutionLastYearWidth]) )
        .attr('x', _this.x(_this.years[_this.budgetExecutionLastYear]-1) );

      _this.nonexecutedOverlay.select('text')
        .attr('x',  _this.x(_this.years[_this.budgetExecutionLastYear]-0.5))
        .attr('y', _this.height+18);
    }
  };

  // Setup Data
  _this.setData = function( _data, _years, _budgetStatuses ){

    _this.data = [];
    _this.stackData = [];

    var dataValues;

    // Fill data & stackData arrays
    _data.forEach(function(d, i){
      
      // Check gaps in values array & fill with 0
      fillGapsInValues( d.values );

      dataValues = d.values.map(function(e){
        return {
          x: e[0],
          y: e[1]
        };
      });

      _this.data.push({
        id: d.id,
        label: d.key,
        values: dataValues
      });

      _this.stackData.push({
        i: i,
        id: d.id,
        label: d.key,
        active: true,
        values: dataValues
      });
    });

    _this.years = fillGapsInYears( _years );

    // Setup Color domain
    _this.color.domain( _data.map(function(d){ return d.id; }) );

    // Setup X domain
    _this.x.domain( d3.extent(_this.years) );

    // Set X section width
    _this.xSectionWidth = _this.width /( _this.x.domain()[1] - _this.x.domain()[0] );

    // Setup Y domain
    var values = _data.map(function(d){ return d.values; });
    var vals = [];
    values.forEach(function(d){
      d.forEach(function(e,i){
        if( vals[i] ){
          vals[i] += e[1];
        } else{
          vals[i] = e[1];
        }
      });
    });
    _this.y.domain([0, d3.max(vals)]);

    // Get Last Year with Execution
    _this.budgetExecutionLastYear = getBudgetExecutionLastYear(_budgetStatuses);

    return _this;
  };

  // Draw Data
  _this.draw = function(){

    _this.svg.append('rect')
      .attr('class', 'bkg-rect')
      .attr('width', _this.width)
      .attr('height', _this.height);

    // Setup X Axis
    var x_axis = _this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + _this.height + ')')
      .call(_this.xAxis);

    x_axis.selectAll('g')
      .attr('data-year', function(d){ return d; });

    // Setup Y Axis
    _this.svg.append('g')
      .attr('class', 'y axis')
      .call(_this.yAxis);

    // Setup Areas containers
    _this.areas = _this.svg.selectAll('.area')
      .data( _this.stack(_this.stackData) )
      .enter().append('g')
        .attr('class', 'area');

    // Setup Areas Paths
    _this.areas.append('path')
      .attr('id', function(d) { return 'area-'+d.id; })
      .attr('class', 'area')
      .attr('d', function(d) { return _this.area(d.values); })
      .style('fill', function(d) { return _this.color(d.id); })
      .on('mouseover',  onAreaMouseOver)
      .on('mouseout',   onAreaMouseOut)
      .on('mousemove',  onAreaMouseMove)
      // event to be listened in the template
      .on('click',      function(d){ $(_this.selector).trigger('area-selected', d); });

    _this.svg.on('mouseout', function(e){
      pointsOut();
      _this.$popover.hide();
      _this.currentYear = null;
    });

    // Check Execution is Completed & Draw Opacity Mask if not
    if( _this.budgetExecutionLastYear !== null ){
      var budgetExecutionLastYearWidth = _this.years[_this.years.length-1] - (_this.years[_this.budgetExecutionLastYear]-1);
      _this.nonexecutedOverlay = _this.svg.append('g')
        .attr('class', 'nonexecuted-overlay');

      _this.nonexecutedOverlay.append('rect')
        .attr('height', _this.height)
        .attr('width', _this.x(_this.years[budgetExecutionLastYearWidth]) )
        .attr('x', _this.x(_this.years[_this.budgetExecutionLastYear]-1) );

      _this.nonexecutedOverlay.append('text')
        .attr('x',  _this.x(_this.years[_this.budgetExecutionLastYear]-0.5))
        .attr('y', _this.height+18)
        .text( _this.budgeted );
    }

    // Setup Areas Lines
    _this.lines = _this.svg.selectAll('.lines')
      .data( _this.stackData )
      .enter().append('path')
        .attr('class', 'line')
        .attr('d', function(d){ return _this.line(d.values); })
        .style('stroke', function(d) { return _this.color(d.id); });

    _this.lines.on('mouseover', function(d){
        d3.select(this).classed('hover', true);
        setupPopover(d, d3.mouse(this));
      });

    // Setup Area Points
    _this.circles = _this.svg.selectAll('.points')
      .data( _this.stackData )
      .enter().append('g')
        .attr('id', function(d) { return 'area-points-'+d.id; })
        .attr('class', 'area-points');

    _this.circles.selectAll('.point')
      .data(function(d){ return getPointsData(d); })
      .enter().append('circle')
      .attr('class', function(d){ return 'point point-'+d.x; })
      .attr('transform', function(d){ return 'translate('+_this.x(d.x)+','+_this.y(d.y0+d.y)+')'; })
      .attr('r', 4)
      .style('stroke', function(d) { return _this.color(d.id); })
      .style('fill', function(d) { return _this.color(d.id); });

    _this.circles.on('mouseover', function(d){
        setupPopover(d, d3.mouse(this));
      });

    // Setup Legend labels
    _this.legend.selectAll('div')
      .data( _this.stackData )
      .enter().append('div')
        .attr('class', 'label')
        .attr('data-id', function(d){ return d.id; })
        .text(function(d){ return d.label; })
        .on('mouseover',  onLegendLabelOver)
        .on('mouseout',   onLegendLabelOut)
        .on('click',      onLegendLabelClick)
        .append('span')
          .style('background-color', function(d) { return _this.color(d.id); })
          .style('border-color', function(d) { return _this.color(d.id); });

    return _this;
  };

  // Upate Elements 
  _this.update = function( transitionDuration ){

    // Set default transition duration value to 500ms
    transitionDuration = typeof transitionDuration !== 'undefined' ? transitionDuration : 500;

    // Update Areas Paths
    _this.areas.data( _this.stack(_this.stackData) );
    _this.areas.selectAll('.area')
      .transition().ease('cubic-out').duration(transitionDuration)
      .attr('d', function(d) { return _this.area(d.values); });

    // Update Areas Lines
    _this.lines.data( _this.stackData )
      .transition().ease('cubic-out').duration(transitionDuration)
      .style('opacity', function(d){ return (d.active) ? 1 : 0; })
      .attr('d', function(d){ return _this.line(d.values); });

    // Update Area Points
    _this.circles.data( _this.stackData );
    _this.circles.selectAll('.point')
      .transition().ease('cubic-out').duration(transitionDuration)
      .style('opacity', function(d){ return (d.y !== 0) ? 1 : 0; })
      .attr('transform', function(d){ return 'translate('+_this.x(d.x)+','+_this.y(d.y0+d.y)+')'; });
  };

  // Area Mouse Events
  var onAreaMouseOver = function(d){

    d3.select(this).classed('hover', true);

    if( !_this.currentYear )  _this.currentYear = getCurrentYear( d3.mouse(this) );

    pointsOver();
    setupPopover(d, d3.mouse(this));
  };

  var onAreaMouseOut = function(d){
    d3.select(this).classed('hover', false);
  };

  var onAreaMouseMove = function(){

    var newYear = getCurrentYear( d3.mouse(this) );

    if( _this.currentYear != newYear ){
      _this.currentYear = newYear;
      pointsOver();
      setupPopoverContent();
    }

    _this.$popover.css( popoverPosition(d3.mouse(this)) );
  };

  // Legend Label Mouse Events
  var onLegendLabelOver = function(d){
    d3.select('#area-'+d.id).classed('hover', true);
    d3.selectAll('#area-points-'+d.id+' .point').classed('hover', true);
  };

  var onLegendLabelOut = function(d){
    d3.select('#area-'+d.id).classed('hover', false);
    d3.selectAll('#area-points-'+d.id+' .point').classed('hover', false);
  };

  var onLegendLabelClick = function(d){

    var labelsInactives = _this.legend.selectAll('.label.inactive').size();

    // Desactivate all labels except clicked if there's no labels inactives
    if( labelsInactives === 0 ){
      _this.legend.selectAll('.label').classed('inactive', true);
      d3.select(this).classed('inactive', false);
      updateAllDataActive();
    }
    // Activate all labels if there's only one label active & we are going to desactivate
    else if( labelsInactives === _this.legend.selectAll('.label').size()-1 && !d3.select(this).classed('inactive') ){
      _this.legend.selectAll('.label').classed('inactive', false);
      updateAllDataActive();
    }
    // Toogle inactive value
    else{
      var val = d3.select(this).classed('inactive');
      d3.select(this).classed('inactive', !val);
      updateDataActive(d.id, val);
    }

    _this.update();
  };


  // Points select & unselect
  var pointsOver = function(){

    // Unselect all points
    pointsOut();

    // Select current year points
    _this.circles.selectAll('.point-'+_this.years[_this.currentYear])
      .attr('r', 5)
      .style('fill', 'white')
      .classed('hover', true);

    // Select current year at x axis
    _this.svg.selectAll('.x.axis .tick[data-year="'+_this.years[_this.currentYear]+'"]')
      .classed('active', true);
  };

  var pointsOut = function(){

    // Unselect all points
    _this.svg.selectAll('.point')
      .attr('r', 4)
      .style('fill', function(d) { return _this.color(d.id); })
      .classed('hover', false);

    // Unselect all years at x axis
    _this.svg.selectAll('.x.axis .tick')
      .classed('active', false);
  };

  var getCurrentYear = function( _mouse ){
    var xPos  = _mouse[0],
        j     = 0;

    while(xPos > ((j*_this.xSectionWidth)+(_this.xSectionWidth*0.5))){ j++; }

    return j;
  };

  // Setup Popover Content
  var setupPopover = function( _data, _mouse ){

    if( _this.$popover.data('id') !== _data.id ){  // Avoid redundancy

      _this.popoverData = _data;
      _this.$popover.data('id', _data.id);
      _this.$popover.find('.popover-title').html( _data.label );
    }

    // Get currentYear if undefined
    if( _this.currentYear === null ){
      _this.currentYear = getCurrentYear( _mouse );
    }
    
    // Setup Popover Content
    setupPopoverContent();

    // Positioning Popover
    _this.$popover.css( popoverPosition(_mouse) ).show();
  };

  var setupPopoverContent = function(){

    if( _this.popoverData === null) return; // Avoid unexpected errors

    var popoverId = _this.$popover.data('id');

    // Get currentYear values
    var values = _this.popoverData.values.filter(function(d){ return d.x == _this.years[_this.currentYear]; });
    var popoverValues = (values.length > 0) ? values[0] : 0;
     
    // Get currentYear values
    var prevValues = _this.popoverData.values.filter(function(d){ return d.x == _this.years[_this.currentYear]-1; });
    var popoverPrevValues = (prevValues.length > 0) ? prevValues[0].y : null;

    // Setup year
    _this.$popover.find('.popover-content-year').html( _this.years[_this.currentYear] );

    // Setup value
    if( _this.dataFormat === "percentage" ){
      _this.$popover.find('.popover-content-value').html(formatDecimal(popoverValues.y*100,2)+' %');
    } else if( _this.dataFormat === "per_capita" ){
      _this.$popover.find('.popover-content-value').html(formatDecimal(popoverValues.y*0.01,2)+' €');
    } else{
      _this.$popover.find('.popover-content-value').html(formatAmount(popoverValues.y));
    }

    // Setup variation
    if( popoverPrevValues ){
      var percentageValue = ((popoverValues.y/popoverPrevValues)-1)*100;
      var labelClass      = (percentageValue >= 0) ? 'label-success' : 'label-danger';
      _this.$popover.find('.popover-content-variation .label').removeClass('label-success, label-danger').addClass(labelClass).html(_this.percentageFormat(percentageValue)+' %');
      _this.$popover.find('.popover-content-variation-year').html( _this.years[_this.currentYear-1] );
      _this.$popover.find('.popover-content-variation').show();
    } else{
      _this.$popover.find('.popover-content-variation').hide();
    }
  };

  // Setup Popover Position
  var popoverPosition = function( _mouse ){
    return {
      'bottom': _this.height+_this.margin.top+_this.margin.bottom-_mouse[1],
      'left': _mouse[0]+_this.margin.left-(_this.$popover.width()*0.5)
    };
  };

  // Update Active State
  var updateDataActive = function( _id, _value){

    // Get area to update
    var areaData = _this.stackData.filter(function(d){ return d.id == _id; })[0];
    areaData.active = _value;

    // Update area values based on active state
    if( areaData.active ){
      areaData.values.forEach(function(d,j){ d.y = _this.data[areaData.i].values[j].y; });
    } else{
      areaData.values.forEach(function(d,j){ d.y = 0; });
    }
  };

  var updateAllDataActive = function(){

    var active;

    _this.stackData.forEach(function(d){
      // Get active state based on related legend label inactive classed
      active = !_this.legend.select('[data-id="'+d.id+'"]').classed('inactive');
      // Update area values if update active state
      if( d.active !== active ){
        d.active = active;
        // Update values based on active state
        if( d.active ){
          d.values.forEach(function(e,f){
            e.y = _this.data[d.i].values[f].y;
          });
        } else{
          d.values.forEach(function(e,f){
            e.y = 0;
          });
        }
      }
    });
  };


  // Auxiliar Methods

  var fillGapsInYears = function( _years ){
    if ( _years.length !== _years[_years.length-1]-_years[0]+1 ) {
      var i;
      for (i = 0; i < _years.length-1; i++) {
        if(_years[i+1] - _years[i] > 1){
          _years.push(_years[i]+1);  // Fill gap
        }
      }
      _years.sort(function(a,b){ return a-b; });
    }
    return _years;
  };

  var fillGapsInValues = function( _values ) {
    // Check if array_length equals last_year_value - first_year_value + 1
    if ( _values.length !== _values[_values.length-1][0]-_values[0][0]+1 ) {
      var i;
      for (i = 0; i < _values.length-1; i++) {
        if(_values[i+1][0] - _values[i][0] > 1){
          _values.push([ _values[i][0]+1, 0 ]);  // Fill gap with 0 value
        }
      }
      _values.sort(function(a,b){ return a[0] - b[0]; });
    }
  };

  var getPointsData = function( _data ) {
    return _data.values.map(function(d){
      d.id = _data.id;    // Add breakdown id to point data
      return d;
    })
    .filter(function(d){
      return d.y !== 0;   // Remove from data years without values
    });
  };

  var getBudgetExecutionLastYear = function( _budgetStatuses ){
    var status = null, i = 0;

    while( i < _this.years.length || status === null ){
      if( _budgetStatuses[i] !== '' ){
        status = i;
      }
      i++;
    }

    return status;
  };

  return _this;
}