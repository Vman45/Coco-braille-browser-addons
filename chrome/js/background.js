// The map used for transilation
var map = {};

//Contraction dict
var contractions_dict = {};

//Abbreviations dict
var abbreviations = {};

//Temporory
var simple_mode = 0;

var compleate_languages_map = [];

var compleate_abbreviations_map = [];

var compleate_contractions_dict = [];

var keycode_map = {"1":"70","2":"68","3":"83","4":"74","5":"75","6":"76","7":"65","8":"71","9":"72","0":"186","0":"59","-1":"18"};


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

var req = new XMLHttpRequest();
req.open("GET", chrome.extension.getURL("braille/languages.txt"),false);
req.send();

var available_languages = [];
var lines = req.response.split("\n");
for (var i = 0, len = lines.length; i < len; i++) {
	  if (lines[i] != ""){
		available_languages.push(lines[i].split("-")[0]);
		var lang = chrome.contextMenus.create({
			"title": lines[i].split("-")[0],
			"parentId": BrailleMenu,
			"id": "Braille_"+lines[i].split("-")[0],
			"contexts": ["editable"],
			"onclick": handleLanguageSelection
		});
	}
}


function handleLanguageSelection(info, tab) {
    var lang = info.menuItemId.replace("Braille_", "");
    default_language=localStorage["default_language"];
  if(!default_language || default_language == ''){
    localStorage["default_language"]=lang;
  }
    chrome.tabs.sendMessage(tab.id, {
        action: "LanguageSelect",
        language: available_languages.indexOf(lang),
        map : compleate_languages_map,
        key_map : keycode_map,
        a_map : compleate_abbreviations_map,
        c_dict : compleate_contractions_dict,        
        s_mode : simple_mode        
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








function load_all_languages()
{
	
	for (var i = 0, len = available_languages.length; i < len; i++) {
		load_language(available_languages[i].split("-")[0]);
		compleate_languages_map.push(map);
		compleate_abbreviations_map.push(abbreviations);
		compleate_contractions_dict.push(contractions_dict);
	}
}

load_all_languages()
//alert(compleate_languages_map[0]["12"]);

function load_language(language){
	//console.log("loading Map for language : %s" + language)
	map = {};
	contractions_dict = {};

	var submap_number = 1;
	append_sub_map("beginning.txt",submap_number,language);

	submap_number = 2;
	append_sub_map("middle.txt",submap_number,language);

	submap_number = 3;
	append_sub_map("punctuations.txt",submap_number,language);

	if (simple_mode == 0)
	{
		var req_contraction_list = new XMLHttpRequest();
		req_contraction_list.open("GET", chrome.extension.getURL("braille/"+language+"/contraction_map_list.txt"),false);
		req_contraction_list.send();
		var files = req_contraction_list.response.split("\n");
		for (var i = 0, len = files.length; i < len; i++) {
			if (files[i] != "" && simple_mode == 0){
				submap_number += 1;
				append_sub_map(files[i],submap_number,language);
				contractions_dict[files[i].slice(0, -4)] = submap_number-1;
			}
		}

		//Load abbreviations if exist
		load_abbrivation(language);
	}
}


function append_sub_map(filename,submap_number,language){
	//console.log("Loading sub map file for : " +language+"/"+filename+"On submap : "+submap_number)
	var req = new XMLHttpRequest();
	req.open("GET", chrome.extension.getURL("braille/"+language+"/"+filename),false);
	req.send();
	var lines = req.response.split("\n");
	for (var i = 0, len = lines.length; i < len; i++) {
		if (lines[i] != ""){
			if ((lines[i].split(" ")[0]) in map)
			{
				map[lines[i].split(" ")[0]].push(lines[i].split(" ")[1]) // may be new line to be removed
				//if (map[lines[i].split(" ")[0]].length != submap_number)
				//	console.log("Repeated on : ",lines[i].split(" ")[0])
			}
			else{
				var list = [];
				for (var j=1; j<submap_number; j++) {
					list.push(" ");
				}
				list.push(lines[i].split(" ")[1]); // may be new line to be removed
				map[lines[i].split(" ")[0]] = list;
			}
		}
	}

	//Fill blank if empty
	for(var key in map) {
		var value = map[key];
		if(value.length < submap_number)
		{
			map[key].push("");
		}
	}
}

function load_abbrivation(language){
	abbreviations = {}
	var req_abbrivation = new XMLHttpRequest();
	req_abbrivation.open("GET", chrome.extension.getURL("braille/"+language+"/abbreviations.txt"),false);
	req_abbrivation.send();
	var lines = req_abbrivation.response.split("\n");
	for (var i = 0, len = lines.length; i < len; i++) {
		if (lines[i] != ""){
			abbreviations[lines[i].split("  ")[0]] = lines[i].split("  ")[1];
		}
	}
}

