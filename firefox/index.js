const data = require("sdk/self").data;
const contextMenu = require("sdk/context-menu");
var tabs = require('sdk/tabs');
const request = require("sdk/request").Request;
const prefs = require("sdk/simple-prefs").prefs;
const notifications = require("sdk/notifications");
const Hotkey = require("sdk/hotkeys").Hotkey;
var buttons = require('sdk/ui/button/action');
var pageMod = require('sdk/page-mod');
console.log ( 'The braille index started' );
const self = require("sdk/self");
const { XMLHttpRequest } = require("sdk/net/xhr");


var req = new XMLHttpRequest();
req.open("GET", self.data.url("braille/languages.txt"),false);
req.send();

var available_languages = [];
var lines = req.response.split("\n");
for (var i = 0, len = lines.length; i < len; i++) {
	  if (lines[i] != "")
		available_languages.push(lines[i].split("-")[0]);
}

console.log("Available languages : ",available_languages);
var searchMenu = createContextMenu(contextMenu.SelectorContext("textarea, input"));



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

function load_language(language){
	console.log("loading Map for language : %s" + language)
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
		req_contraction_list.open("GET", self.data.url("braille/"+language+"/contraction_map_list.txt"),false);
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
	console.log("Loading sub map file for : " +language+"/"+filename+"On submap : "+submap_number)
	var req = new XMLHttpRequest();
	req.open("GET", self.data.url("braille/"+language+"/"+filename),false);
	req.send();
	var lines = req.response.split("\n");
	for (var i = 0, len = lines.length; i < len; i++) {
		if (lines[i] != ""){
			if ((lines[i].split(" ")[0]) in map)
			{
				map[lines[i].split(" ")[0]].push(lines[i].split(" ")[1]) // may be new line to be removed
				if (map[lines[i].split(" ")[0]].length != submap_number)
					console.log("Repeated on : ",lines[i].split(" ")[0])
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
	req_abbrivation.open("GET", self.data.url("braille/"+language+"/abbreviations.txt"),false);
	req_abbrivation.send();
	var lines = req_abbrivation.response.split("\n");
	for (var i = 0, len = lines.length; i < len; i++) {
		if (lines[i] != ""){
			abbreviations[lines[i].split("  ")[0]] = lines[i].split("  ")[1];
		}
	}
}









function notifyUser(message) {
	notifications.notify({
		title: "Braille : ",
		text: message
	});
}


function getActiveWorker() {
	for (var i = 0; i < workers.length; i++) {
		if (workers[i].tab === tabs.activeTab) {
			return workers[i];
		};
	}
	return undefined;
}


function emitSafely(funcName, payload) {
    try {
		var worker = getActiveWorker();
        if (worker) {
            worker.port.emit(funcName, payload);
        }
    }
    catch(e) {
		console.log("Exception occured",e);
        // Ignoring exceptions because SDK may throw error if user accidently moved away from the current page
        // where page-mod is registered
    }

}





function createContextMenu(kontext) {
	var enableOrDisable = contextMenu.Item({
		label: "Enable",
		data: 'enable',
		contentScriptFile: [data.url('enable_disable.js')],
		context: kontext,
		onMessage: function(data) {
			if (data.kind == 'context') {
				this.data = data.data;
			}
		}
	}),
	separator = contextMenu.Separator();

	var menu_items = [enableOrDisable,separator];
	for (var i = 0, len = available_languages.length; i < len; i++) {
		malayalam = contextMenu.Item({
		label: available_languages[i],
		data: available_languages[i],
		context: kontext
		});
		menu_items.push(malayalam);
	}

	var brailleMenu = contextMenu.Menu({
		label: "Braille",
		context: kontext,
		contentScriptWhen: 'ready',
		contentScriptFile: [data.url('context_menu.js')],
		items: menu_items, //[enableOrDisable, separator, hindi, malayalam],
		image: data.url('icons/icon.png'),
		onMessage: function(data) {
            enableOrDisableBraille (data);
		}
	});

	return brailleMenu;
};

function enableOrDisableBraille(options) {
    var action = 'initBraille';
    if (options.data == 'disable') {
        action = 'disableBraille';
    }
    else if (options.data == 'enable') {
        // We are enabling braille without saying which language to use. So just using the preferred one
        //options.data.id = available_languages.indexOf(prefs.language);
        if (options.data === null || options.data == '' || options.data == 'none') {
            // No preferred language available.
            notifyUser("Error while enabling braille. Default language is not set. Click on the language name or set a default language from the preferences screen (Tools -> Add-ons -> Extensions -> Preferences) before enabling braille");
            return;
        }
    }
    else {
        // If no default language is set, setting current one as the default language
        if (prefs.language == 'none') {
            //options.data.id = available_languages.indexOf(options.data);
            prefs.language = options.data;
        }
    }
    emitSafely(action, options);
}


// Options which are available to content script
const options = {
	progressImage: data.url('progress.gif'),
	languages: available_languages
};

var workers = [];

var page = pageMod.PageMod({
	include: '*',
	contentScriptWhen: 'ready',
	contentScriptFile: "./braille.js",
	contentScriptOptions: options,
	attachTo: ["existing", "top"],
	onAttach: function(worker) {
		workers.push(worker);
		worker.on("detach", function() {
			var index = workers.indexOf(worker);
			if (index >= 0) workers.splice(index, 1);
		});
		//worker.port.on("fetchSuggestions", fetchSuggestions);
		//worker.port.on("learnWord", learnWord);
		worker.on("enableOrDisableBraille", enableOrDisableBraille);
		worker.port.on("enableOrDisableBraille", enableOrDisableBraille);
		worker.port.emit("set_available_languages", available_languages);
		worker.port.emit("set_languages_map", compleate_languages_map);
		worker.port.emit("set_abbreviations_map", compleate_abbreviations_map);
		worker.port.emit("set_contractions_dict", compleate_contractions_dict);
		worker.port.emit("set_simple_mode", simple_mode);
		worker.port.emit("set_keycode_map", keycode_map);
	}
});


var enableHotKey = Hotkey({
	combo: "accel-shift-b",
	onPress: function() {
        // This is a toggle hotkey. If braille is enable, this will disable else it will be enabled
        // This sends a enableOrDisable message
        emitSafely('enableOrDisable', {});
	}
});


//var searchMenu = createContextMenu(contextMenu.SelectorContext("textarea, input"));
tabs.open("http://127.0.0.1/");

