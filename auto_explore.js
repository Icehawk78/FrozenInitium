var data = {type: 'explore_ajax', ignoreCombatSites: true, v: window.verifyCode};
var times = 0;
var currentLocation = $('.header-location').text();
var doExplore = function() {
  $.getJSON('ServletCharacterControl', data, function(res) {
    if (res['locationName'] == currentLocation) {
      times += 1;
      console.log('Not found, explored', times, 'times.');
      setTimeout(doExplore, (res['isComplete'] ? 1000 : res['timeLeft'] + 1 * 1000));
    } else {
      if (res['error']) {
        window.location = 'combat.jsp';
      } else {
        window.location = 'main.jsp';
      }
    }
  });
};
doExplore();
