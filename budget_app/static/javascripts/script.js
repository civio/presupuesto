$(document).ready(function(){

	// Use cookies to check is user arrives to 'articulo' from 'politicas' or 'resumen'.
	// We set the cookie when passing by the overview page...
	if ($('body').hasClass('body-summary')) {
		$.cookie('resumen', 1);

	// ...and check it when displaying a policy/article page.
	} else if ($('body').hasClass('body-policies')) {
		var cookie = $.cookie('resumen');
		// If the cookie is set, modify the Back link to point to the overview page.
		if( cookie && cookie === '1' ) {
			$('.history-back a').attr('href', getOverviewLink()).html('← Volver');
			$.removeCookie('resumen');
		}

	// Visiting any other page removes the cookie.
	} else {
		$.removeCookie('resumen');
	}

	// Initialice tooltips
	$('[data-toggle="tooltip"]').tooltip();

	// Support a 'chrome-less' mode to improve the look of the site when embedded via iframe.
	// Just add a query parameter 'embedded', with any value, and the chrome-less model will be
	// enabled. A cookie is set for the remainder of the session so we don't have to pollute
	// all the app links to carry the query parameter around.
	queryParameters = $.deparam.querystring();
	if ( typeof queryParameters.embedded != 'undefined' ) {
		$.cookie('embedded', 1);	// Set a cookie to remember we are embedded
	}
	if ( $.cookie('embedded')==='1' ) {
		$('.hide-when-embedded').hide();
	}
});
