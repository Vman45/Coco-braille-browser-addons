var BrailleMenu = chrome.contextMenus.create({
    "title": "Braille",
    "contexts": ["editable"]
});

var disableOrEnable = chrome.contextMenus.create({
    "type": "checkbox",
    "title": "Enable",
    "parentId": BrailleMenu,
    "id": "Braille_disable",
    "checked": true,
    "contexts": ["editable"],
    "onclick": disableOrEnableBraille
});

var separator = chrome.contextMenus.create({
    type: "separator",
    parentId: BrailleMenu,
    contexts: ["editable"]
});

var hindi = chrome.contextMenus.create({
    "title": "Hindi",
    "parentId": BrailleMenu,
    "id": "Braille_hi",
    "contexts": ["editable"],
    "onclick": handleLanguageSelection
});

var malayalam = chrome.contextMenus.create({
    "title": "Malayalam",
    "parentId": BrailleMenu,
    "id": "Braille_ml",
    "contexts": ["editable"],
    "onclick": handleLanguageSelection
});

function handleLanguageSelection(info, tab) {
    var lang = info.menuItemId.replace("Braille_", "");
    default_language=localStorage["default_language"];
  if(!default_language || default_language == ''){
    localStorage["default_language"]=lang;
  }
    chrome.tabs.sendMessage(tab.id, {
        action: "LanguageSelect",
        language: lang,
        server: BrailleServer()
    });
}

function BrailleServer() {
    return "";
}

function disableOrEnableBraille(info, tab) {
    chrome.tabs.sendMessage(tab.id, {
    action: "BrailleEnable",
    enable: info.checked,
        language: localStorage["default_language"],
    });
}




chrome.extension.onMessage.addListener(
function(request, sender, sendResponse) {
    switch (request.action) {
    case 'contextMenu':
    chrome.contextMenus.update(
    disableOrEnable,
    {
      type: 'checkbox',
      checked: request.text === 'true'
    });
    break;
    }
});
