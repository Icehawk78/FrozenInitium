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
        var defaultData = {str: {initial: currentStats.str, current: currentStats.str, hitCalc: 0, hits: -1}, dex: {initial: currentStats.dex, current: currentStats.dex, hitCalc: 0, hits: -1}, int: {initial: currentStats.int, current: currentStats.int, hitCalc: 0, hits: -1}};
        myStats = parseData(characterName, defaultData);
        if (myStats.str.current != currentStats.str || myStats.dex.current != currentStats.dex || myStats.int.current != currentStats.int) {
            console.log(myStats);
            console.log(currentStats);
            myStats = defaultData;
            storeData(characterName, myStats);
        }
        ['str', 'dex', 'int'].forEach(function(type) {
            var stats = getStats(type, myStats[type].initial, myStats[type].current, myStats[type].hitCalc);
            console.log('[' + type + '] Min: ', stats.min, ' Max: ', stats.max);
        });
        var htmlString = '<div style="display:inline-block; cursor: pointer;" id="statCounter"><img style="padding: 0 0 3px;" src="https://s3.amazonaws.com/imappy/3d_bar_chart.png" border="0/"></div>';
        $(".header-stats").prepend(htmlString);
        $("#statCounter").click(showTracker);
    });
 
    var mkPopup = function(content) {
        // close all other popups, increment popup counter
        closePagePopup();
        currentPopupStackIndex++;
        exitFullscreenChat();

        var pagePopupId = "page-popup" + currentPopupStackIndex;

        //No elements have z-index on the combat screen, so we
        //cant have page-popup-glass there because it relies on
        //z-index to not cover everything
        var structure = "<div id='"+pagePopupId+"'><div id='" +
            pagePopupId+"-content' style='min-height:150px;' " +
            "class='page-popup'><img id='banner-loading-icon' " +
            "src='javascript/images/wait.gif' border=0/></div>" +
            "<div class='page-popup-glass'></div><a class='page-popup-X' " +
            "onclick='closePagePopup()'>X</a></div>";

        // checks if current page is doesn't have #page-popup-root
        //  and adds the needed div if it is
        if ($("#page-popup-root").length === 0) {
            $('<div id="page-popup-root"></div>').insertAfter(".chat_box");
        }

        //Create popup
        $("#page-popup-root").append(structure);

        //If chat box doesnt have z index, remove glass box
        if( $(".chat_box").css('z-index') != '1000100') {
            $(".page-popup-glass").remove();
        }

        //Fill popup with content
        $("#"+pagePopupId+"-content").html(content);

        // pressing escape will close the popup
        if (currentPopupStackIndex === 1) {
            $(document).bind("keydown",function(e) {
                if ((e.keyCode == 27)) {
                    closePagePopup();
                }
            });
        }

        // hides previous popup if there was one
        if (currentPopupStackIndex > 1) {
            $("#page-popup" + (currentPopupStackIndex-1)).hide();
        }
    };

    showTracker = function() {
        var popTitle = "<center><h3>Stat Tracker for "+characterName+"</h3></center>";
        var popContent = "";

        popContent += '<center><h3>Saved stats:</h3></center>';

        ['str', 'dex', 'int'].forEach(function(type) {
            var stats = getStats(type, myStats[type].initial, myStats[type].current, myStats[type].hitCalc);
            popContent += "<center>["+type+"] Min: " + Math.round(stats.min * 100) / 100 + ", Max: " + Math.round(stats.max * 100) / 100 + ", Hits: " + myStats[type].hits + "</center>";
        });

        mkPopup(popTitle + popContent);
    };

    doHandAttack = function(hand) {
        showBannerLoadingIcon();
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
                        if (myStats[type].hits > -1 || myStats[type].current < newStats[type]) {
                            if (myStats[type].hits === -1) {
                                myStats[type].initial = newStats[type];
                            }
                            myStats[type].hits += 1;
                            if (myStats[type].current < newStats[type]) {
                                myStats[type].hitCalc = myStats[type].hits;
                            }
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

    var data = {type: 'explore_ajax', ignoreCombatSites: true, v: window.verifyCode};
    var times = 0;
    var exploreTimes = 0;
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
    $.get('locationcharacterlist.jsp', null, function(res) {
        var matches = res.match(/(ServletCharacterControl\?type=collectDogecoin&characterId=.+?)"/);
        matches.shift();
        var doReload = matches.length == 1 ? function() {loadInlineItemsAndCharacters();} : function() {};
        matches.forEach(function(m) {$.
    });
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
