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


  // Setup SVG Object
  _this.setup = function(selector){

    // Add legend
    _this.legend = d3.select(selector).append('div')
      .attr('class', 'stacked-area-chart-legend');

    // Setup Popover
    _this.$popover = $(selector).find('.popover');

    // Setup width & height based on container
    _this.width   = $(selector).width() - _this.margin.left - _this.margin.right;
    _this.height  = 0.5*$(selector).width() - _this.margin.top - _this.margin.bottom;

    // Setup X & Y scale range
    _this.x.range([0, _this.width]);
    _this.y.range([_this.height, 0]);

    _this.xAxis.tickSize(-_this.height);
    _this.yAxis.tickSize(-_this.width);

    // Add SVG
    _this.svg = d3.select(selector).append('svg')
        .attr('class', 'stacked-area-chart')
        .attr('width', _this.width + _this.margin.left + _this.margin.right)
        .attr('height', _this.height + _this.margin.top + _this.margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + _this.margin.left + ',' + _this.margin.top + ')');

    return _this;
  };

  // Setup Data
  _this.setData = function( _data, _years, _budgetStatuses ){
    
    console.log('* StackedAreaChart.setData', _data);

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
    _this.budgetExecutionLastYear = _this.budgetExecutionLastYear(_budgetStatuses);

    return _this;
  };

  // Draw Data
  _this.draw = function(){

    console.log('* StackedAreaChart.draw', _this.stackData);

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
      .on('mouseover', function(d){
        d3.select(this).classed('hover', true);
        _this.setupPopover(d);
        _this.$popover.css( _this.popoverPosition(d3.mouse(this)) ).show();
      })
      .on('mouseout', function(){
        d3.select(this).classed('hover', false);
      })
      .on('mousemove', _this.onMouseMove);

    _this.svg.on('mouseout', function(e){
      _this.svg.selectAll('.point').classed('hover', false);
      _this.$popover.hide();
      _this.currentYear = null;
    });

    // Check Execution is Completed & Draw Opacity Mask if not
    if( _this.budgetExecutionLastYear !== null ){
      var budgetExecutionLastYearWidth = _this.years[_this.years.length-1] - (_this.years[_this.budgetExecutionLastYear]-1);
      _this.svg.append('rect')
        .attr('class', 'nonexecuted-overlay')
        .attr('height', _this.height)
        .attr('width', _this.x(_this.years[budgetExecutionLastYearWidth]) )
        .attr('x', _this.x(_this.years[_this.budgetExecutionLastYear]-1) );
    }

    // Setup Areas Lines
    _this.lines = _this.svg.selectAll('.lines')
      .data( _this.stackData )
      .enter().append('path')
        .attr('class', 'line')
        .attr('d', function(d){
          return _this.line(d.values);
          //.filter(function(e){ return e.y !== 0; })); // Filter years without data
        })
        .style('stroke', function(d) { return _this.color(d.id); });

    _this.lines.on('mouseover', function(d){
        d3.select(this).classed('hover', true);
        _this.setupPopover(d);
        _this.$popover.css( _this.popoverPosition(d3.mouse(this)) ).show();
      });

    // Setup Area Points
    _this.circles = _this.svg.selectAll('.points')
      .data( _this.stackData )
      .enter().append('g')
        .attr('id', function(d) { return 'area-points-'+d.id; })
        .attr('class', 'area-points');

    _this.circles.selectAll('.point')
      .data(function(d){ return _this.getPointsData(d); })
      .enter().append('circle')
      .attr('class', 'point')
      .attr('transform', function(d){ return 'translate('+_this.x(d.x)+','+_this.y(d.y0+d.y)+')'; })
      //.attr('cx', function(d){ return _this.x(d.x); })
      //.attr('cy', function(d){ return _this.y(d.y0+d.y); })
      .attr('r', 4)
      .style('fill', function(d) { return _this.color(d.id); });

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
          _this.updateDataActive(d.id, val);
          _this.update();
        })
        .append('span')
          .style('background-color', function(d) { return _this.color(d.id); })
          .style('border-color', function(d) { return _this.color(d.id); });

    return _this;
  };

  // Upate Elements 
  _this.update = function(){

    // Update Areas Paths
    _this.areas.data( _this.stack(_this.stackData) );
    _this.areas.selectAll('.area')
      .transition().ease('cubic-out').duration(500)
      .attr('d', function(d) { return _this.area(d.values); });

    // Update Areas Lines
    _this.lines.data( _this.stackData )
      .transition().ease('cubic-out').duration(500)
      .style('opacity', function(d){ return (d.active) ? 1 : 0; })
      .attr('d', function(d){ return _this.line(d.values); });

    // Update Area Points
    _this.circles.data( _this.stackData );
    _this.circles.selectAll('.point')
      .transition().ease('cubic-out').duration(500)
      .style('opacity', function(d){ return (d.y !== 0) ? 1 : 0; })
      .attr('transform', function(d){ return 'translate('+_this.x(d.x)+','+_this.y(d.y0+d.y)+')'; });
  };

  // Mouse Move Event
  _this.onMouseMove = function(){

    var xPos  = d3.mouse(this)[0],
        w     = _this.width /( _this.x.domain()[1] - _this.x.domain()[0] ),
        j     = 0;

    while(xPos > ((j*w)+(w*0.5))){ j++; }

    if( _this.currentYear != j ){
      _this.currentYear = j;
      _this.circles.selectAll('circle').attr('r', 4).classed('hover', false);
      _this.$popover.find('.popover-content .table tr').removeClass('active').filter('.year-'+_this.years[_this.currentYear]).addClass('active');
      _this.circles.each(function(d){
        d3.select(this).selectAll('circle').each(function(e,i){
          if(i==j){
            d3.select(this).attr('r', 5).classed('hover', true);
          }
        });
      });
    }

    _this.$popover.css( _this.popoverPosition(d3.mouse(this)) );
  };

  // Setup Popover Content
  _this.setupPopover = function( data ){

    if( _this.$popover.data('id') == data.id ) return;  // Avoid redundancy

    _this.$popover.data('id', data.id);
    _this.$popover.find('.popover-title').html( data.label );
    _this.$popover.find('.popover-content').html( '<table class="table table-condensed"><tbody>'+data.values.map(function(d){
      return (d.y > 0) ? '<tr class="year-'+d.x+'"><td>'+d.x+'</td><th>'+Math.ceil(d.y).toLocaleString('es-ES')+' €</th></tr>' : '';
    }).join('')+'</tbody></table>' );
    if( _this.currentYear ){
      _this.$popover.find('.popover-content .table tr.year-'+_this.years[_this.currentYear]).addClass('active');
    }
  };

  // Setup Popover Position
   _this.popoverPosition = function( _mouse ){
    return {
      'bottom': _this.height+_this.margin.top+_this.margin.bottom-_mouse[1]+10,
      'left': _mouse[0]+_this.margin.left-(_this.$popover.width()*0.5)
    };
  };

  // Update Active State
  _this.updateDataActive = function( _id, _value){

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

  _this.getPointsData =  function( _data ) {
    return _data.values.map(function(d){
      d.id = _data.id;    // Add breakdown id to point data
      return d;
    })
    .filter(function(d){
      return d.y !== 0;   // Remove from data years without values
    });
  };

  _this.budgetExecutionLastYear = function( _budgetStatuses ){
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