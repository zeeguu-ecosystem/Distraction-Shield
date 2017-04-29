define(['blockedSiteBuilder','BlockedSiteList','interception','UserSettings','constants','storage'],
function background(blockedSiteBuilder, BlockedSiteList, interception, UserSettings, constants, storage) {
//Set that holds the urls to be intercepted
    var blockedSites = new BlockedSiteList.BlockedSiteList();
    var interceptDateList = [];
    var localSettings = new UserSettings.UserSettings();
    var authenticator;

    /* --------------- ------ setter for local variables ------ ---------------*/

    setLocalSettings = function (newSettings) {
        var oldState = localSettings.getState();
        localSettings.copySettings(newSettings);
        if (oldState != localSettings.getState()) {
            replaceListener();
        }
    };

    setLocalBlacklist = function (newList) {
        blockedSites.setList(newList.getList());
        replaceListener();
    };

    setLocalAuthenticator = function (newAuthenticator) {
        authenticator = newAuthenticator;
    };

    setLocalInterceptDateList = function (dateList) {
        interceptDateList = dateList;
    };

    getLocalSettings = function() {
        return localSettings;
    };
    /* --------------- ------ Storage retrieval ------ ---------------*/
// Methods here are only used upon initialization of the session.
// Usage found in init.js

    retrieveSettings = function (callback, param) {
        storage.getSettings(function (settingsObject) {
            localSettings = settingsObject;
            return callback(param);
        });
    };

    retrieveBlockedSites = function (callback) {
        storage.getBlacklist(function (blacklist) {
            blockedSites.setList(blacklist.getList());
            return callback();
        });
    };

    /* --------------- ------ Updating of variables ------ ---------------*/

    addUrlToBlockedSites = function (unformattedUrl, onSuccess) {
        blockedSiteBuilder.createNewBlockedSite(unformattedUrl, function (newBS) {
            if (blockedSites.addToList(newBS)) {
                console.log('adding ' + newBS.getUrl() + ' to blockedSites: ' + JSON.stringify(blockedSites));//todo remove
                storage.setBlacklist(blockedSites);
                onSuccess();
            }
        });
    };

    /* --------------- ------ webRequest functions ------ ---------------*/

    replaceListener = function () {
        removeWebRequestListener();
        var urlList = blockedSites.getActiveUrls();
        if (localSettings.getState() == "On" && urlList.length > 0) {
            addWebRequestListener(urlList);
        }
    };

    addWebRequestListener = function (urlList) {
        chrome.webRequest.onBeforeRequest.addListener(
            handleInterception
            , {
                urls: urlList
                , types: ["main_frame"]
            }
            , ["blocking"]
        );
    };

    removeWebRequestListener = function () {
        chrome.webRequest.onBeforeRequest.removeListener(handleInterception);
    };

    intercept = function (details) {
        interception.incrementInterceptionCounter(details.url, blockedSites);
        interception.addToInterceptDateList();
        var redirectLink;
        var params;
        //if (!authenticator.sessionAuthentic) {
        //    redirectLink = chrome.extension.getURL('loginPage/login.html');
        //    params = "?forceLogin=" + constants.zeeguuExLink;
        //} else {
            redirectLink = constants.zeeguuExLink;
        //    params = "?sessionID=" + localSettings.getSessionID();
        //}
        params = "?redirect=" + details.url;

        return {redirectUrl: redirectLink + params};
    };

    handleInterception = function (details) {
        if (localSettings.getState() == "On") {
            if (details.url.indexOf("tds_exComplete=true") > -1) {
                turnOffInterception();
                var url = details.url.replace(/(\?tds_exComplete=true|&tds_exComplete=true)/, "");
                return {redirectUrl: url};
            } else {
                return intercept(details);
            }
        }
    };

    turnOffInterception = function () {
        localSettings.turnOffFromBackground();
        storage.setSettings(localSettings);
    };

    getConsole = function(){
        return this.console;
    };

    chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
        if (request.message == "replaceListener") {
            setLocalBlacklist(BlockedSiteList.deserializeBlockedSiteList(request.siteList));
        } else if (request.message == "updateSettings") {
            setLocalSettings(UserSettings.deserializeSettings(request.settings));
        }
    });

    return {
        getLocalSettings            : getLocalSettings,
        setLocalSettings            : setLocalSettings,
        setLocalBlacklist           : setLocalBlacklist,
        setLocalInterceptDateList   : setLocalInterceptDateList,
        retrieveSettings            : retrieveSettings,
        retrieveBlockedSites        : retrieveBlockedSites,
        addUrlToBlockedSites        : addUrlToBlockedSites,
        replaceListener             : replaceListener,
        addWebRequestListener       : addWebRequestListener,
        removeWebRequestListener    : removeWebRequestListener,
        intercept                   : intercept,
        handleInterception          : handleInterception,
        turnOffInterception         : turnOffInterception,
        getConsole                  : getConsole
    };

});