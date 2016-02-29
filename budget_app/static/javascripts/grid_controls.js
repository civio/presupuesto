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

// Activar slider de años (Documentation: http://seiyria.com/bootstrap-slider/)
function initSlider(selector, years, callback, startValue, labels) {

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