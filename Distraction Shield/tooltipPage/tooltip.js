import * as blockedSiteBuilder from "../modules/blockedSiteBuilder.js"
import BlockedSiteList from '../classes/BlockedSiteList'
import * as stringutil from "../modules/stringutil.js"
import {openTabSingleton} from "../modules/tabutil"
import * as storage from '../modules/storage'
import {tds_blacklist} from '../constants'

let saveButton = $('#saveBtn');
let optionsButton = $('#optionsBtn');
let statisticsButton = $('#statisticsBtn');


function connectButtons() {
    optionsButton.on('click', openOptionsPage);
    statisticsButton.on('click', openStatisticsPage);
    setSaveButtonFunctionality();
}


function openStatisticsPage() {
    openTabSingleton(chrome.runtime.getURL('statisticsPage/statistics.html'), () => {
        window.close();
    });
}

function openOptionsPage() {
    openTabSingleton(chrome.runtime.getURL('optionsPage/options.html'), () => {
        window.close();
    });
}

/* ----------- ----------- Save button functionality ----------- ----------- */

/**
 * match the current url to the current list of blockedSiteItems
 * @param {string} url to be compared
 * @param {function} callback function that takes the blockedSite to which the url was found to be equal to
 */
function patternMatchUrl(url, callback) {
    storage.getBlacklistPromise().then(blockedSiteList => {
        let list = blockedSiteList.list;
        let item = null;
        list.some(function (bl) {
            if (stringutil.wildcardStrComp(url, bl.url)) {
                item = bl;
                return true;
            }
            return false;
        });
        callback(item);
    });

}

/**
 * returns a function that gets the corresponding BlockedSite from the background and updates its checkboxVal to the new value.
 * @param url of the current page
 */
function toggleBlockedSite(url) {
    return function () {
        storage.getBlacklistPromise().then(blockedSiteList => {
            let list = blockedSiteList.list;
            let newItem = null;
            for (let i = 0; i < list.length; i++) {
                if (stringutil.wildcardStrComp(url, list[i].url)) {
                    newItem = list[i];
                    newItem.checkboxVal = !newItem.checkboxVal;
                    storage.updateBlockedSiteInStorage(newItem);
                    break;
                }
            }
        });
    }
}

function setSaveButton(blocked){
    if (blocked)
        saveButton.text("Block");
    else
        saveButton.text("Unblock");
}

/**
 * Change colour and update functionality of the button when we add a new website to the blacklist/blockedSiteList
 */
function setSaveButtonToSuccess() {
    saveButton.attr('class', 'btn btn-success');
    saveButton.text("Succes!");
    saveButton.unbind();
    setTimeout(function () {
        saveButton.attr('class', 'btn btn-info');
        setSaveButton(true);
        setSaveButtonFunctionality();
    }, 3000);
}

function saveCurrentPageToBlacklist() {
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        let activeTab = arrayOfTabs[0];
        blockedSiteBuilder.createBlockedSiteAndAddToStorage(activeTab.url)
            .catch((error) => {alert(error);});
    });
}

/**
 * Update the functionality of the button to one of 3 states:
 * 1. Add a non-blacklisted website to the blacklist/blockedSiteList
 * 2. Disable the blocking of this blacklisted website
 * 3. Enable the blocking of this blacklisted website
 */
function setSaveButtonFunctionality() {
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        let activeTab = arrayOfTabs[0];
        let url = activeTab.url;
        patternMatchUrl(url, function (matchedBlockedSite) {
            saveButton.unbind();
            if (matchedBlockedSite != null) {
                saveButton.on('click', toggleBlockedSite(url));
                if (matchedBlockedSite.checkboxVal) {
                    setSaveButton(false);
                } else {
                    setSaveButton(true);
                }
            } else {
                saveButton.on('click', saveCurrentPageToBlacklist);
                setSaveButton(true);
            }
        });
    });
}

/* ----------- ----------- Storage Listener ----------- ----------- */

chrome.storage.onChanged.addListener(changes => {
    handleStorageChange(changes)
});

function handleStorageChange(changes) {
    if (tds_blacklist in changes) {
        let oldBlockedSiteList = BlockedSiteList.deserializeBlockedSiteList(changes[tds_blacklist].oldValue);
        let newBlockedSiteList = BlockedSiteList.deserializeBlockedSiteList(changes[tds_blacklist].newValue);
        if (oldBlockedSiteList.length < newBlockedSiteList.length) {
            setSaveButtonToSuccess();
        } else {
            setSaveButtonFunctionality();
        }
    }
}

/* ----------- ----------- Initialization ----------- ----------- */

/**
 * function that initiates the functionality of the tooltip
 */
connectButtons();
