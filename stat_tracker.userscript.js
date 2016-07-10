// ==UserScript==
// @name            initium-stats
// @version         0.0.1
// @match           https://www.playinitium.com/*
// @match           http://www.playinitium.com/*
// @grant           none
// ==/UserScript==

function parseData(key, defaultVal) {
	var value = localStorage.getItem(key);
	if (typeof(value) == 'undefined' || value === null) {
		storeData(key, defaultVal);
		value = defaultVal;
	} else {
		value = JSON.parse(value);
	}
	return value;
}

function storeData(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function getStats(type, initial, current, hits) {
	var stats;
//	var compmod = (initial == 5) ? 0.005 : 0;
//	var diff = current - initial - compmod;
	var mod, modIncrement;
	var max, minMax;

	if (statSelect()=="str") {
		mod=0.0009954;
		max=11;
		minMax=9;
		modIncrement=0.0000014965;
//		modMax=0.0012947;
	}
	else if (statSelect()=="dex") {
		mod=0.00057334;
		max=10;
		minMax=8;
		modIncrement=0.0000007418493;
//		modMax=0.00072171;
	}
	else if (statSelect()=="int") {
		mod=0.0001414791;
		max=10;
		minMax=8;
		modIncrement=0.0000002897295;
//		modMax=0.000199425;
	}

	return {
		max: evalmaxStats(initial, current, hits, mod, modIncrement, max, minMax),
		min: evalminStats(initial, current, hits, mod, modIncrement, max, minMax)
	};
}

function evalmaxStats(initial, current, hits, mod, modIncrement, max, minMax) {
	for (var g = max; g >= minMax; g -= 0.01) {
		var tracked = initial;
		for (var i = 1; i <= hits; i++) {
			tracked = tracked + (g - tracked) * mod;
		}
		if (((Math.round(tracked*100))/100) == current) {
			return g;
		}
		mod += modIncrement;
	}
}

function evalminStats(initial, current, hits, mod, modIncrement, max, minMax) {
	for (var g = minMax; g <= max; g += 0.01) {
		var tracked = initial;
		for (var i = 1; i <= hits; i++) {
			tracked = tracked + (g - tracked) * mod;
		}
		if (((Math.round(tracked*100))/100) == current) {
			return g;
		}
		mod += modIncrement;
	}
}

var characterName = $('[rel=#profile]').text();
var myStats = null;
$.get($('.character-display-box').find('a').first().attr('rel'), function(res) {
	var response = $($.parseHTML(res));
	var currentStats = {
		str: parseFloat(response.find('[name=strength]').text().split(' ')[0]),
		dex: parseFloat(response.find('[name=dexterity]').text().split(' ')[0]),
		int: parseFloat(response.find('[name=intelligence]').text().split(' ')[0])
	};
	var defaultData = {str: {initial: currentStats.str, current: currentStats.str, hits: 0}, dex: {initial: currentStats.dex, current: currentStats.dex, hits: 0}, int: {initial: currentStats.int, current: currentStats.int, hits: 0}};
	myStats = parseData(characterName, defaultData);
	if (myStats.str.current != currentStats.str || myStats.dex.current != currentStats.dex || myStats.int.current != currentStats.int) {
		myStats = defaultData;
		storeData(characterName, myStats);
	}
	['str', 'dex', 'int'].forEach(function(type) {
		var stats = getStats(type, myStats[type].initial, myStats[type].current, myStats[type].hits);
		console.log('[' + type + '] Min: ', stats.min, ' Max: ', stats.max);
	});
});

function doAttack(hand) {
	if (myStats === null) {
		return setTimeout(function() {doAttack(hand);}, 1000);
	} else {
		var data = {type: 'attack', hand: hand, v: window.verifyCode};
		$.get('ServletCharacterControl', data, function() {
			$.get($('.character-display-box').find('a').first().attr('rel'), function(res) {
				var response = $($.parseHTML(res));
				var newStats = {
					str: parseFloat(response.find('[name=strength]').text().split(' ')[0]),
					dex: parseFloat(response.find('[name=dexterity]').text().split(' ')[0]),
					int: parseFloat(response.find('[name=intelligence]').text().split(' ')[0])
				};
				['str', 'dex', 'int'].forEach(function(type) {
					if (myStats[type].hits > 0 || myStats.current[type] < newStats[type]) {
						myStats[type].hits += 1;
						myStats[type].current = newStats[type];
					}
				});
				storeData(characterName, myStats);
				window.location = 'combat.jsp';
			});
		});
	}
}

function combatAttackWithLeftHand() {
	doAttack('LeftHand');
}

function combatAttackWithRightHand() {
	doAttack('RightHand');
}
