// @wolfram77


// for tooltip
$(document).ready(function() {
  $('[is]').each(function() {
    $(this).attr('data-tooltip', $(this).attr('is'));
  });
  $('[is]').tooltip();
});
