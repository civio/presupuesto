function StackedAreaChart() {

  var _this = this;

  _this.margin  = {top: 20, right: 20, bottom: 30, left: 80};
 
  _this.x = d3.scale.linear();
  _this.y = d3.scale.linear();

  _this.color = d3.scale.category10();

  _this.xAxis = d3.svg.axis()
      .scale(_this.x)
      .orient('bottom');

  _this.yAxis = d3.svg.axis()
      .scale(_this.y)
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

    // Setup width & height based on container
    _this.width   = $(selector).width() - _this.margin.left - _this.margin.right;
    _this.height  = $(selector).width()/2 - _this.margin.top - _this.margin.bottom;

    // Setup X & Y scale range
    _this.x.range([0, _this.width]);
    _this.y.range([_this.height, 0]);

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
  _this.setData = function( _data ){
    
    console.log('* StackedAreaChart.setData', _data);

    // Setup Stack Data
    _this.data = _this.stack( _data.map(function(d){
      return {
        id: d.id,
        label: d.key,
        values: d.values.map(function(e) {
          return {x: e[0], y: e[1]};
        })
      };
    }) );

    // Setup Color domain
    _this.color.domain( _data.map(function(d){ return d.id; }) );

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

    return _this;
  };

  // Draw Data
  _this.draw = function(){

    console.log('* StackedAreaChart.draw', _this.data);

    // Setup Areas containers
    _this.areas = _this.svg.selectAll('.area')
      .data( _this.data )
      .enter().append('g')
        .attr('class', 'area');

    // Setup Areas Paths
    _this.areas.append('path')
      .attr('class', 'area')
      .attr('d', function(d) { return _this.area(d.values); })
      .style('fill', function(d) { return _this.color(d.id); });

    // Setup X Axis
    _this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + _this.height + ')')
      .call(_this.xAxis);

    // Setup Y Axis
    _this.svg.append('g')
      .attr('class', 'y axis')
      .call(_this.yAxis);

    // Setup Legand labels
    _this.legend.selectAll('div')
      .data( _this.data )
      .enter().append('div')
        .attr('class', 'label')
        .text(function(d){ return d.label; })
        .append('span')
          .style('background', function(d) { return _this.color(d.id); });

    return _this;
  };

  return _this;
}