// Helper methods for handling controls related to data displays

function setRedrawOnTabsChange(container, callback) {
  $(container+' a').click(function(event) {
    event.preventDefault();
    $(container+' .active').removeClass('active');
    $(event.target).blur().parents(container+' li').addClass('active');
    callback();
  });
}

function setRedrawOnButtonGroupChange(selector, callback) {
  $(selector).click(function(event) {
    event.preventDefault();
    $(event.target).siblings().removeClass('active');
    $(event.target).addClass('active').blur();
    callback();
  });
}

function getActiveButton(selector) {
  var button = $(selector+' .active a')[0];
  return button==undefined ? undefined : button.id;
}

// Activar slider de años (Documentation: http://egorkhmelev.github.com/jslider/)
function initSlider(selector, years, callback, startValue, labels) {
  var mostRecentYear = Number(years[years.length-1]);
  if ( years.length > 1 ) {
    
    // Setup bootstrap-slider
    $(selector).slider({
      min: parseInt(years[0]),
      max: mostRecentYear,
      value: startValue ? startValue : mostRecentYear,
      tooltip: 'always',
      ticks: years.map(function(d){ return parseInt(d); }),
      ticks_labels: years
    }).on('change', callback );
    
  } else {
    $(selector).val(mostRecentYear).hide();
    $(selector).parent().append('<p>'+mostRecentYear+'</p>');
  }
}

function getUIState() {
  return {
    field: getActiveButton('#btn-field') == 'income' ? 'income' : 'expense',
    view: getActiveButton('#btn-field'),
    format: $('#select-format').val(),
    year: $("#year-selection").val()
  };
}

function sameUIState(a, b) {
  return a.view==b.view && a.field==b.field && a.year==b.year && a.format==b.format;
}