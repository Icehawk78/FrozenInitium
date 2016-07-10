// ==UserScript==
// @name            initium-stats
// @version         0.0.1
// @match           https://www.playinitium.com/*
// @match           http://www.playinitium.com/*
// @run-at document-idle
// @grant           none
// ==/UserScript==

function init() {
    parseData = function(key, defaultVal) {
        var value = localStorage.getItem(key);
        if (typeof(value) == 'undefined' || value === null) {
            storeData(key, defaultVal);
            value = defaultVal;
        } else {
            value = JSON.parse(value);
        }
        return value;
    };

    storeData = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    getStats = function(type, initial, current, hits) {
        var stats;
        //	var compmod = (initial == 5) ? 0.005 : 0;
        //	var diff = current - initial - compmod;
        var mod, modIncrement;
        var max, minMax;

        if (type == "str") {
            mod=0.0009954;
            max=11;
            minMax=9;
            modIncrement=0.0000014965;
            //		modMax=0.0012947;
        } else if (type == "dex") {
            mod=0.00057334;
            max=10;
            minMax=8;
            modIncrement=0.0000007418493;
            //		modMax=0.00072171;
        } else if (type == "int") {
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
    };

    evalmaxStats = function(initial, current, hits, mod, modIncrement, max, minMax) {
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
    };

    evalminStats = function(initial, current, hits, mod, modIncrement, max, minMax) {
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
    };

    characterName = $('[rel=#profile]').text();
    myStats = null;
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
            console.log(myStats);
            console.log(currentStats);
            myStats = defaultData;
            storeData(characterName, myStats);
        }
        ['str', 'dex', 'int'].forEach(function(type) {
            var stats = getStats(type, myStats[type].initial, myStats[type].current, myStats[type].hits);
            console.log('[' + type + '] Min: ', stats.min, ' Max: ', stats.max);
        });
    });

    doHandAttack = function(hand) {
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
                        if (myStats[type].hits > 0 || myStats[type].current < newStats[type]) {
                            myStats[type].hits += 1;
                            myStats[type].current = newStats[type];
                        }
                    });
                    storeData(characterName, myStats);
                    window.location = 'combat.jsp';
                });
            });
        }
    };

    combatAttackWithLeftHand = function() {
        doHandAttack('LeftHand');
    };

    combatAttackWithRightHand = function() {
        doHandAttack('RightHand');
    };
}

function addJS_Node (text, s_URL, funcToRun, runOnLoad) {
    var D                                   = document;
    var scriptNode                          = D.createElement ('script');
    if (runOnLoad) {
        scriptNode.addEventListener ("load", runOnLoad, false);
    }
    scriptNode.type                         = "text/javascript";
    if (text)       scriptNode.textContent  = text;
    if (s_URL)      scriptNode.src          = s_URL;
    if (funcToRun)  scriptNode.textContent  = '(' + funcToRun.toString() + ')()';

    var targ = D.getElementsByTagName ('head')[0] || D.body || D.documentElement;
    targ.appendChild (scriptNode);
}

addJS_Node (init, null, init);
