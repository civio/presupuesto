function StackedAreaChart() {

  var _this = this;

  _this.currentYear = null;

  _this.margin  = {top: 20, right: 20, bottom: 30, left: 80};
 
  _this.x = d3.scaleLinear();
  _this.y = d3.scaleLinear();

  _this.line = d3.line()
    .x(function(d){ return _this.x(+d.data.year); })
    .y(function(d){ return _this.y(d[1]); });

  _this.color = d3.scaleOrdinal( d3.schemeCategory10 );

  _this.xAxis = d3.axisBottom()
    .scale(_this.x)
    .tickPadding(10)
    .tickSize(0);

  _this.yAxis = d3.axisLeft()
    .scale(_this.y)
    .tickPadding(6)
    .ticks(4);

  _this.area = d3.area()
    .x(function(d) { return _this.x(+d.data.year); })
    .y0(function(d) { return _this.y(d[0]); })
    .y1(function(d) { return _this.y(d[1]); });

  _this.dataFormat = null;


  // Setup SVG Object
  _this.setup = function(selector){
    _this.selector = selector;

    // Remove charts previously created
    if( $(selector+' .stacked-area-chart').length > 0 ){
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
        .attr('aria-hidden', 'true')
      .append('g')
        .attr('transform', 'translate(' + _this.margin.left + ',' + _this.margin.top + ')');

    // Set dimensions & add resize event
    setDimensions();
    d3.select(window).on('resize', _this.resize);

    return _this;
  };


  // Set Dimensions
  var setDimensions = function(){
    var w = $(_this.selector).width();
    // Setup right & left margins based on width
    if (w > 620){
      _this.margin.right = 20;
      _this.margin.left = 80;
      _this.yAxis.tickPadding(6);
    } else {
      _this.margin.right = _this.margin.left = 15;
      _this.yAxis.tickPadding(0);
    }
    // Setup width & height based on container
    _this.width   = w - _this.margin.left - _this.margin.right;
    // Set height based on width container
    var aspectRatio = (w > 920) ? 0.5 : (w > 620) ? 0.5625 : 0.75;
    _this.height  = aspectRatio * $(_this.selector).width() - _this.margin.top - _this.margin.bottom;

    // Setup SVG dimensions
    d3.select(_this.selector+' .stacked-area-chart')
      .attr('width', _this.width + _this.margin.left + _this.margin.right)
      .attr('height', _this.height + _this.margin.top + _this.margin.bottom);

    _this.svg.attr('transform', 'translate(' + _this.margin.left + ',' + _this.margin.top + ')');

    // Setup X & Y scale range
    _this.x.range([0, _this.width]);
    _this.y.range([_this.height, 0]);

    _this.yAxis.tickSize(-_this.width);

    // Set X section width
    _this.xSectionWidth = _this.width /( _this.x.domain()[1] - _this.x.domain()[0] );
  };

  // Resize Event Handler
  _this.resize = function(){
    if (parseInt(_this.svg.attr('width')) === $(_this.selector).width())
      return;

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

    // Update nonexecuted overlays
    if (_this.overlays) {
      _this.overlays.select('rect')
        .attr('height', _this.height)
        .attr('width', function(d){ return _this.x(_this.x.domain()[0]+1); })
        .attr('x', function(d){ return _this.x(d.key-1); });

      _this.overlays.select('text')
        .attr('x', function(d){ return _this.x(d.key-0.5); })
        .attr('y', _this.height+10);
    }
  };


  // Setup Data
  _this.setData = function( _values, _labels, _years, _budgetStatuses ){

    _this.values = _values;
    _this.labels = _labels;
    _this.years = fillGapsInYears( _years );
    _this.budgetStatuses = _budgetStatuses;

    // Setup stack
    _this.stack = d3.stack()
      .keys(Object.keys(_this.labels))
      .order(d3.stackOrderDescending);

    _this.stackData = getStackData(_this.values);

    // Setup Color domain based on given data, unless another one was previously specified explicitely
    if ( _this.color.domain == [] )
      _this.color.domain( _this.stackData.map(function(d){ return d.key; }) );

    // Setup X domain
    _this.x.domain( d3.extent(_this.years) );

    // Force x axis ticks values to avoid gaps
    // http://stackoverflow.com/questions/28129412/d3-non-continuous-dates-domain-gives-gaps-on-x-axis
    _this.xAxis.tickValues(_this.years);

    // Set X section width
    _this.xSectionWidth = _this.width / ( _this.x.domain()[1] - _this.x.domain()[0] );

    // Setup Y domain
    var totals = _this.values.map( function(d) {
      var values = d3.entries(d).filter(function(e){ return e.key !== 'year'; }); // get values except year
      return d3.sum(values, function(e){ return e.value; });
    });
    _this.y.domain([0, d3.max(totals)]);

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

    // Setup Areas
    _this.areas = _this.svg.selectAll('.area')
      .data( _this.stackData )
      .enter().append('path')
        .attr('id', function(d) { return 'area-'+d.key; })
        .attr('class', 'area')
        .attr('d', _this.area)
        .style('fill', getColor)
        .on('mouseover',  onAreaMouseOver)
        .on('mouseout',   onAreaMouseOut)
        .on('mousemove',  onAreaMouseMove)
        // event to be listened in the template
        .on('click',      onAreaClick);

    _this.svg.on('mouseout', function(e){
      pointsOut();
      _this.$popover.hide();
      _this.currentYear = null;
    });

    // Check if Budget is in Execution or a Project & Draw Opacity Mask
    _this.drawStatusesOverlays();

    // Setup Areas Lines
    _this.lines = _this.svg.selectAll('.lines')
      .data( _this.stackData )
      .enter().append('path')
        .attr('class', 'line')
        .attr('d', _this.line)
        .style('stroke', getColor);

    _this.lines
      .on('mouseover', function(d){
        d3.select(this).classed('hover', true);
        setupPopover(d, d3.mouse(this));
      })
      .on('click', onAreaClick);

    // Setup Area Points
    _this.circles = _this.svg.selectAll('.points')
      .data( _this.stackData )
      .enter().append('g')
        .attr('id', function(d) { return 'area-points-'+d.key; })
        .attr('class', 'area-points');

    _this.circles.selectAll('.point')
      .data(getPointsData)
      .enter().append('circle')
      .attr('class', function(d){ return 'point point-'+d.data.year; })
      .attr('transform', getPointTransform)
      .attr('r', 4)
      .style('stroke', getColor)
      .style('fill', getColor)
      .style('visibility', getPointVisibility);

    _this.circles
      .on('mouseover', function(d){
        setupPopover(d, d3.mouse(this));
      })
      .on('click', onAreaClick);

    // Setup Legend labels
    if (_this.stackData.length < 50) {  // Avoid huge legends with more than 50 items
      _this.legend.selectAll('div')
        .data( _this.stackData )
        .enter().append('div')
          .attr('class', 'label')
          .attr('data-id', function(d){ return d.key; })
          .text(function(d){ return _this.labels[d.key]; })
          .on('mouseover',  onLegendLabelOver)
          .on('mouseout',   onLegendLabelOut)
          .on('click',      onLegendLabelClick)
          .append('span')
            .style('background-color', getColor)
            .style('border-color', getColor);
    }

    return _this;
  };


  // Draw Satatuses Overlays
  _this.drawStatusesOverlays = function(){

    // get years where status is not empty & year is greater than first year in years array
    var nonexecutedYears = d3.entries(_this.budgetStatuses).filter(function(d){ return d.value !== '' && +d.key > _this.years[0]; });

    if (nonexecutedYears.length > 0) {
      // Setup overlays
      _this.overlays = _this.svg.selectAll('.overlay')
        .data( nonexecutedYears )
        .enter().append('g')
          .attr('class', function(d){ return (d.value === 'PR') ? 'overlay project-overlay' : 'overlay nonexecuted-overlay'; });
    
      _this.overlays.append('rect')
        .attr('height', _this.height)
        .attr('width', function(d){ return _this.x(_this.x.domain()[0]+1); })
        .attr('x', function(d){ return _this.x(d.key-1); });

      _this.overlays.append('text')
        .attr('x', function(d){ return _this.x(d.key-0.5); })
        .attr('y', _this.height+10)
        .attr('dy', '0.71em')
        .text( function(d){ return (d.value === 'PR') ? _this.proposed : _this.budgeted; });
    }

    return _this;
  };


  // Upate Elements 
  _this.update = function( transitionDuration ){
    // Set default transition duration value to 500ms
    transitionDuration = typeof transitionDuration !== 'undefined' ? transitionDuration : 500;

    // Update Areas Paths
    _this.areas.data( _this.stackData )
      .attr('id', function(d) { return 'area-'+d.key; })
      .transition()
        .ease(d3.easeCubicOut)
        .duration(transitionDuration)
        .style('fill', getColor)
        .attr('d', _this.area);

    // Update Areas Lines
    _this.lines.data( _this.stackData )
      .transition()
        .ease(d3.easeCubicOut)
        .duration(transitionDuration)
        .style('opacity', function(d){ return (d.active) ? 1 : 0; })
        .style('stroke', getColor)
        .attr('d', this.line);

    // Update Area Points
    _this.circles.data( _this.stackData );
    _this.circles.selectAll('.point')
      .data(getPointsData)
      .transition()
        .ease(d3.easeCubicOut)
        .duration(transitionDuration)
        .style('opacity', function(d){ return (d.active) ? 1 : 0; })
        .style('stroke', getColor)
        .style('fill', getColor)
        .attr('transform', getPointTransform)
        .style('visibility', getPointVisibility);
  };

  // Area Mouse Events
  var onAreaMouseOver = function(d){
    //d3.select(this).classed('hover', true);

    if( !_this.currentYear ) _this.currentYear = getCurrentYear( d3.mouse(this) );

    pointsOver();
    setupPopover(d, d3.mouse(this));

    _this.areas.classed('inactive', true);
    d3.select(this)
      .classed('active', true)
      .classed('inactive', false);
  };

  var onAreaMouseOut = function(d){
    _this.areas.classed('active', false);
    _this.areas.classed('inactive', false);
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

  var onAreaClick = function(d){
    $(_this.selector).trigger('area-selected', {id: d.key, label: _this.labels[d.key]});
  };

  // Legend Label Mouse Events
  var onLegendLabelOver = function(d){
    d3.select('#area-'+d.key).classed('active', true);
    d3.selectAll('#area-points-'+d.key+' .point').classed('hover', true);
  };

  var onLegendLabelOut = function(d){
    d3.select('#area-'+d.key).classed('active', false);
    d3.selectAll('#area-points-'+d.key+' .point').classed('hover', false);
  };

  var onLegendLabelClick = function(d){
    var labelsInactives = _this.legend.selectAll('.label.inactive').size();

    // Desactivate all labels except clicked if there's no labels inactives
    if( labelsInactives === 0 ){
      _this.legend.selectAll('.label').classed('inactive', true);
      d3.select(this).classed('inactive', false);
    }
    // Activate all labels if there's only one label active & we are going to desactivate
    else if( labelsInactives === _this.legend.selectAll('.label').size()-1 && !d3.select(this).classed('inactive') ){
      _this.legend.selectAll('.label').classed('inactive', false);
    }
    // Toogle inactive value
    else{
      var val = d3.select(this).classed('inactive');
      d3.select(this).classed('inactive', !val);
    }

    updateDataActive();

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
      .style('fill', getColor)
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

    if( !_data.active ){
       _this.$popover.hide();
      return;
    }

    _this.popoverData = _data;
    _this.$popover.data('id', _data.key);
    _this.$popover.find('.popover-title').html( _this.labels[_data.key] );

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
    if( _this.popoverData === null || _this.popoverData === undefined ) return; // Avoid unexpected errors

    var key = _this.$popover.data('id');

    // Get currentYear values
    var values = _this.popoverData.filter(function(d){ return d.data.year == _this.years[_this.currentYear]; });
    var popoverValue = (values.length > 0) ? values[0].data[key] : 0;
     
    // Get currentYear values
    var prevValues = _this.popoverData.filter(function(d){ return d.data.year == _this.years[_this.currentYear]-1; });
    var popoverPrevValue = (prevValues.length > 0) ? prevValues[0].data[key] : null;

    // Setup year
    _this.$popover.find('.popover-content-year').html( _this.years[_this.currentYear] );

    // Setup value
    if( _this.dataFormat === 'percentage' ){
      _this.$popover.find('.popover-content-value').html(Formatter.percentage(popoverValue));
    } else if( _this.dataFormat === "per_capita" ){
      _this.$popover.find('.popover-content-value').html(Formatter.amountDecimal(popoverValue, .01));
    } else{
      _this.$popover.find('.popover-content-value').html(Formatter.amount(popoverValue));
    }

    // Setup variation
    if( popoverPrevValue ){
      var percentageValue = (popoverValue/popoverPrevValue)-1;
      var labelClass      = (percentageValue >= 0) ? 'label-success' : 'label-danger';
      _this.$popover.find('.popover-content-variation .label').removeClass('label-success, label-danger').addClass(labelClass).html(Formatter.percentageSigned(percentageValue));
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
  var updateDataActive = function(){
    var active,
        valueUpdated,
        valuesUpdated = [];

    // get valuesUpdated array
    _this.values.forEach(function(d){
      valueUpdated = {};
      for (var value in d) {
        if (value !== 'year') {

          active = !_this.legend.select('[data-id="'+value+'"]').classed('inactive');
          valueUpdated[value] = active ? d[value] : 0;
        }
      }
      valueUpdated.year = d.year;
      valuesUpdated.push(valueUpdated);
    });

    // Update stackData
    _this.stackData = getStackData(valuesUpdated);
    _this.stackData.forEach(function(d){
      d.active = !_this.legend.select('[data-id="'+d.key+'"]').classed('inactive');
    });
  };


  // Auxiliar Methods

  var getStackData = function( values ) {
    return _this.stack(values)
      .map(function(d){ d.active = true; return d; })  // add active attribute
      .sort(function(a,b){ return a.index-b.index; }); // sort data based on stack order index
  };

  var fillGapsInYears = function( _years ){
    if ( _years.length !== _years[_years.length-1]-_years[0]+1 ) {
      var min = _years[0],
          max = _years[_years.length-1],
          i;
      _years = [];
      for (i = min; i <= max; i++) {
        _years.push(i);
      }
    }
    return _years;
  };


  // !!!TODO --> we need this?
  var fillGapsInValues = function( _values ) {
    // Check if array_length equals last_year_value - first_year_value + 1
    if ( _values.length !== _values[_values.length-1][0]-_values[0][0]+1 ) {
      var i = _values.length-1;
      while (i > 0) {
        if (_values[i][0] - _values[i-1][0] > 1) {
          _values.splice(i, 0, [_values[i][0]-1, 0]);
          i++;
        }
        i--;
      }
    }
    return _values;
  };

  var getColor =  function(d) {
    return _this.color(d.key);
  };

  var getPointsData = function(data) {
    return data.map(function(d){
      d.key = data.key;    // Add breakdown key to point data
      d.active = data.active;
      return d;
    });
  };

  var getPointTransform = function(d){
    return 'translate('+_this.x(+d.data.year)+','+_this.y(d[1])+')';
  };

  var getPointVisibility = function(d){
    return (d.data[d.key] !== 0) ? 'visible' : 'hidden';
  }

  var getBudgetExecutionLastYear = function( _budgetStatuses ){
    var status = null, i = _this.years.length-1;

    while( i > 0 ){
      if( _budgetStatuses[_this.years[i]] !== '' ){
        status = i;
      }
      i--;
    }
    return status;
  };

  return _this;
}