// Helper methods for handling controls related to data displays

function setRedrawOnTabsChange(container, callback) {
  // Listen changes on url hash
  $(window).bind('hashchange', function(e) {
    // Get hash states    
    var state = $.deparam.fragment();

    // Change tab, but only if really needed!
    // Note, for example, that a year change will update the hash. We don't want to react then.
    if (state.view && state.view!==getDataTab()) {
      setDataTab(state.view);
      callback();
    }
  });

  // Handle click on tabs with pushState
  $(container+' a').click(function(e) {
    e.preventDefault();
    var state = $.deparam.fragment();
    // Clear item hash if exists
    if (state.item) $.bbq.removeState('item');
    // Set new state
    $.bbq.pushState( {'view': $(this).attr('href').substring(1)} );
  });

  // Initially trigger redraw
  var state = $.deparam.fragment();
  if (state.view) {
    setDataTab(state.view);
  } else {
    state.view = getDataTab();
    $.bbq.pushState(state);
  }
  callback();
}

function getDataTab() {
  return $('section').data('tab');
}

function setDataTab(view) {
  $('section').data('tab', view);
}

function setRedrawOnButtonGroupChange(selector, callback) {
  $(selector).click(function(event) {
    event.preventDefault();
    $(event.target).siblings().removeClass('active');
    $(event.target).addClass('active').blur();
    callback();
  });
}

function unfoldItem(gridData, itemId) {
  var found = false;
  for ( i=0; i<gridData.length && !found; i++ ) {
    if ( gridData[i].key == itemId ) {
      var parent = gridData[i]._parent;
      while (parent !== null) {
        parent._expanded = true;
        parent = parent._parent;
      }
      found = true;
    }
  }
  return found;
}

// Activar slider de años (Documentation: https://seiyria.com/bootstrap-slider/)
function initSlider(selector, years, startValue) {
  // Skip if container not exists
  if ($(selector).length === 0) return;

  // Convert years array to number & fill gaps
  years = fillGapsInYears(years.map(function(d){ return +d; }));

  var mostRecentYear = Number(years[years.length-1]);

  // Setup bootstrap-slider
  if ( years.length > 1 ) {
    $(selector).slider({
      min: years[0],
      max: mostRecentYear,
      value: startValue ? startValue : mostRecentYear,
      tooltip: 'always',
      ticks: years,
      ticks_labels: years
    });
  }
  // Hide year slider & add current year
  else {
    $(selector).val(mostRecentYear);
    $(selector).parent().parent().addClass('single-year');
    $(selector).parent().append('<p>'+mostRecentYear+'</p>');
  }
}

function setEmbedModal() {
  $('.data-controllers .chart-embed-btn').click(function(e){
    e.preventDefault();
    var url   = window.location.protocol+'//'+window.location.host+window.location.pathname+'?widget=1'+window.location.hash;
    var code  = '<iframe src="'+url+'" width="100%" scrolling="no" marginheight="0" frameborder="0"></iframe><\script type="text/javascript" src="'+window.location.origin+'/static/javascripts/iframeResizer.min.js"\>\<\/script\>\<script type="text/javascript"\>iFrameResize();\<\/script\>';
    $('#modal-embed .modal-body textarea').val( code );
  });
}

function setRedrawOnSliderChange(selector, startValue, callback) {
  // Handle change on year slider with pushState
  $(selector).on('change', function(e) {
    $.bbq.pushState({'year': e.value.newValue});
    callback();
  });

  // Initially trigger hashchange.
  // XXX: Handling the initial hash handling here is quite confusing once you forget, tbh.
  var state = $.deparam.fragment();
  if (state.year && state.year != startValue) {
    $(selector).slider('setValue', +state.year);
    callback();
  } else {
    state.year = $(selector).val();
    $.bbq.pushState(state);
  }
}

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

function getUIState() {
  var state = $.deparam.fragment();
  var field = $('section').data('field'),
      view = getDataTab(),
      year = (state.year && state.year !== '') ? state.year : $('#year-selection').val();

  return {
    // The templates used to display one particular programme or article have a defined
    // 'field' value, either income or expense. The main entity page, on the other hand,
    // doesn't define a 'field', and shows both revenues and expenditures, depending
    // on the current tab.
    field:  (field !== undefined) ? field : (view == 'income' ? 'income' : 'expense'),
    view:   view,
    format: $('#select-format').val(),
    year:   year
  };
}

function sameUIState(a, b) {
  return /*a.type==b.type &&*/ a.view==b.view && a.field==b.field && a.year==b.year && a.format==b.format;
}