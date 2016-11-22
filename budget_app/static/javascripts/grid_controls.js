// Helper methods for handling controls related to data displays

function setRedrawOnTabsChange(container, callback) {
  // Listen changes on url hash
  $(window).bind('hashchange', function(e) {
    // Get hash states    
    var state = $.deparam.fragment();

    // Change tab
    if (state.view) {
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

  // Initially trigger hashchange   
  var state = $.deparam.fragment();
  if (state.view) {
    $(window).trigger('hashchange');
  } else {
    state.view = $('section').data('tab');
    $.bbq.pushState(state);
  }
}

function setDataTab(type) {
  $('section').data('tab', type);
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
      var parent = gridData[i].parent;
      while (parent != null) {
        parent._expanded = true;
        parent = parent.parent;
      }
      found = true;
    }
  }
  return found;
}

// Activar slider de años (Documentation: http://seiyria.com/bootstrap-slider/)
function initSlider(selector, years, callback, startValue) {
  // Skip if container not exists
  if ($(selector).size()===0) return;

  var mostRecentYear = Number(years[years.length-1]);

  // Setup bootstrap-slider
  if ( years.length > 1 ) {
    $(selector).slider({
      min: parseInt(years[0]),
      max: mostRecentYear,
      value: startValue ? startValue : mostRecentYear,
      tooltip: 'always',
      ticks: years.map(function(d){ return parseInt(d); }),
      ticks_labels: years
    }).on('change', callback );
    
  }
  // Hide year slider & add current year
  else {
    $(selector).val(mostRecentYear);
    $(selector).parent().parent().addClass('single-year');
    $(selector).parent().append('<p>'+mostRecentYear+'</p>');
  }
}

function getUIState() {
  var field = $('section').data('field');
  return {
    type:   $('section').data('tab'),
    field:  field == 'income' ? 'income' : 'expense',
    view:   field,
    format: $('#select-format').val(),
    year:   $("#year-selection").val()
  };
}

function sameUIState(a, b) {
  return a.type==b.type && a.view==b.view && a.field==b.field && a.year==b.year && a.format==b.format;
}