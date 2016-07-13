var data = {type: 'explore_ajax', ignoreCombatSites: true, v: window.verifyCode};
var times = 0;
var currentLocation = $('.header-location').text();
doExplore = function() {
  showBannerLoadingIcon();
  $.getJSON('ServletCharacterControl', data, function(res) {
    if (res.locationName == currentLocation) {
      times += 1;
      exploreTimes += res.isComplete ? 1 : 0;
      console.log('Not found, explored', times, 'times.');
      $('.main-dynamic-content-box.paragraph').text('Not found, attempted ' + times + ' times, explored ' + exploreTimes + ' times. (res.isComplete: ' + res.isComplete + ', res.timeLeft: ' + res.timeLeft + ')');
      setTimeout(doExplore, (res.timeLeft + 1) * 1000);
    } else {
      if (res.error) {
        window.location = 'combat.jsp';
      } else {
        window.location = 'main.jsp';
      }
    }
  });
};
doExplore();
