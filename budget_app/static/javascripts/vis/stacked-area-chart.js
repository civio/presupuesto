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
      .orient('bottom');

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


  // Setup SVG Object
  _this.setup = function(selector){

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

    _this.xAxis.tickSize(-_this.height);
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
   
    // Setup Stack Data
    _this.data = _data.map(function(d){
      return {
        id: d.id,
        label: d.key,
        values: d.values.map(function(e){
          return {
            x: e[0],
            y: e[1]
          };
        })
      };
    });

    _this.stackData = _data.map(function(d, i){
      return {
        i: i,
        id: d.id,
        label: d.key,
        active: true,
        values: d.values.map(function(e){
          return {
            x: e[0],
            y: e[1]
          };
        })
      };
    });

    _this.years = _years;

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
    _this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + _this.height + ')')
      .call(_this.xAxis);

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
      _this.svg.selectAll('.point').attr('r', 4).classed('hover', false);
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
        .on('mouseover', function(d){
          d3.select('#area-'+d.id).classed('hover', true);
          d3.selectAll('#area-points-'+d.id+' .point').classed('hover', true);
        })
        .on('mouseout', function(d){
          d3.select('#area-'+d.id).classed('hover', false);
          d3.selectAll('#area-points-'+d.id+' .point').classed('hover', false);
        })
        .on('click', function(d){
          var val = d3.select(this).classed('inactive');
          d3.select(this).classed('inactive', !val);
          updateDataActive(d.id, val);
          _this.update();
        })
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

    hoverPoints();
    setupPopover(d, d3.mouse(this));
  };

  var onAreaMouseOut = function(d){
    d3.select(this).classed('hover', false);
  };

  var onAreaMouseMove = function(){

    var newYear = getCurrentYear( d3.mouse(this) );

    if( _this.currentYear != newYear ){
      _this.currentYear = newYear;
      hoverPoints();
      setupPopoverContent();
    }

    _this.$popover.css( popoverPosition(d3.mouse(this)) );
  };

  var hoverPoints = function(){

    _this.circles.selectAll('.point')
      .attr('r', 4)
      .classed('hover', false);
    _this.circles.selectAll('.point-'+_this.years[_this.currentYear])
      .attr('r', 6)
      .classed('hover', true);
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
    var popoverValues = _this.popoverData.values.filter(function(d){ return d.x == _this.years[_this.currentYear]; })[0];
     
    // Get currentYear values
    var popoverPrevValues = (_this.currentYear > 0) ? _this.popoverData.values.filter(function(d){ return d.x == _this.years[_this.currentYear]-1; })[0].y : null;

    // Setup year
    _this.$popover.find('.popover-content-year').html( _this.years[_this.currentYear] );

    // Setup value
    if( _this.dataFormat === "percentage" ){
      _this.$popover.find('.popover-content-value').html('<b>'+formatDecimal(popoverValues.y*100,2)+' %</b>');
    } else if( _this.dataFormat === "per_capita" ){
      _this.$popover.find('.popover-content-value').html('<b>'+formatDecimal(popoverValues.y,2)+' €</b>');
    } else{
      _this.$popover.find('.popover-content-value').html('<b>'+formatAmount(popoverValues.y)+'</b>');
    }

    // Setup variation
    if( popoverPrevValues ){
      var percentageValue = ((popoverValues.y/popoverPrevValues)-1)*100;
      var labelClass      = (percentageValue >= 0) ? 'label-success' : 'label-danger';
      _this.$popover.find('.popover-content-variation').html('<span class="label '+labelClass+'">'+formatDecimal(percentageValue,1)+' %</span>').show();
      _this.$popover.find('.popover-content-variation-label').show().find('.variation-year').html( _this.years[_this.currentYear-1] );
    } else{
      _this.$popover.find('.popover-content-variation, .popover-content-variation-label').hide();
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


  // Auxiliar Methods

  var getPointsData =  function( _data ) {
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