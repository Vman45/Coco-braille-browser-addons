(function() {
	var isHovering=false;
	
	var current_language = 0;
	
	var pressedKeys = "";

	var simple_mode = 0;

	var compleate_languages_map = [];

	var compleate_abbreviations_map = [];

	var compleate_contractions_dict = [];

	var keycode_map = {"1":"70","2":"68","3":"83","4":"74","5":"75","6":"76","7":"65","8":"71","9":"72","0":"186","0":"59","-1":"18"};
	
	var braille_letter_map_pos = 0;
	
	var caps_lock = 0;
	
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action == "LanguageSelect") {
			initVarnam(request);
		} 
		else if (request.action == 'VarnamEnable') {
			if(!request.enable){
				disableVarnam();
			}else{
				if(!request.language || request.Language == ''){
					alert("Error while enabling braille. Default language is not set. Click on the language name or set a default language from the preferences screen (Menu -> Settings -> Extensions -> Varnam -> Options) before enabling braille");
					return;
				}
				initVarnam(request);
			}
		}
	});

	function listenDocumentEvents() {
		window.document.addEventListener('mouseover', function(e) {
			window.pressed = "Nothing";
			var event = $.event.fix(e);
			var active = event.target;
			var lang = $(active).data('braille-lang');
			if (!lang || lang == 'en' || lang == '') {
				chrome.extension.sendMessage({
					action: "contextMenu",
					text: "false"});
			}else{
				chrome.extension.sendMessage({
					action: "contextMenu",
					text: "true"});
			}
		});
	}



	function initVarnam(request) {
		var active = window.document.activeElement;
		if (active) {
			//$(active).data('braille-lang', data);
			current_language = request.language;
			compleate_languages_map = request.map;
			keycode_map = request.key_map;
			compleate_abbreviations_map = request.a_map;
			compleate_contractions_dict = request.c_dict;    
			simple_mode = request.s_mode;

			//$(active).data('braille-input-value', active.value);

			$(active).off('keydown', key_press);
			$(active).on('keydown', key_press);
			$(active).off('keyup', key_release);
			$(active).on('keyup', key_release);
		}
	}

	function disableVarnam() {
		var active = window.document.activeElement;
		if (active) {
			$(active).removeData('braille-lang');
			$(active).removeData('braille-server');
			$(active).removeData('braille-input-value');
			$(active).off('keydown', hookVarnamIME);
			$(active).off('keyup', showSuggestions);
		}
	}
	
	
	function case_insensitive_comp(strA, strB) 
	{
		return strA.toLowerCase().localeCompare(strB.toLowerCase());
	}

function case_insensitive_comp(strA, strB) {
 	return strA.toLowerCase().localeCompare(strB.toLowerCase());
}

function insertAtCaret(txtarea,text) {
	var scrollPos = txtarea.scrollTop;
	var strPos = 0;
	strPos = txtarea.selectionStart;
	var front = (txtarea.value).substring(0,strPos);
	var back = (txtarea.value).substring(strPos,txtarea.value.length);
	txtarea.value=front+text+back;
	strPos = strPos + text.length;
	txtarea.selectionStart = strPos;
	txtarea.selectionEnd = strPos;
	txtarea.focus();
	txtarea.scrollTop = scrollPos;
}

function setCaretPosition(elem, caretPos) {
	if(elem != null) {
		if(elem.createTextRange) {
			var range = elem.createTextRange();
			range.move('character', caretPos);
			range.select();
		}
		else {
			if(elem.selectionStart) {
				elem.focus();
				elem.setSelectionRange(caretPos, caretPos);
			}
			else
				elem.focus();
		}
	}
}


function key_release(event) {
	//var event = $.event.fix(e);
	var activeElement = event.target;
	if(pressedKeys != ""){
		pressedKeys = pressedKeys.split("");
		pressedKeys = pressedKeys.sort( case_insensitive_comp )
		pressedKeys = pressedKeys.join("");
		//console.log(activeElement.items);
		console.log(pressedKeys);

		//Move map position to contraction if any
		console.log(compleate_contractions_dict[current_language]);
		if  ( pressedKeys in compleate_contractions_dict[current_language]){
			braille_letter_map_pos = compleate_contractions_dict[current_language][pressedKeys];
			console.log("Switching to map position "+ braille_letter_map_pos);
		}

		if (pressedKeys == "-1")
		{
			if (braille_letter_map_pos != 0)
				braille_letter_map_pos = 0;
			else
				braille_letter_map_pos = 1;
			console.log(braille_letter_map_pos);
		}

		if (pressedKeys == "0")
		{
			braille_letter_map_pos = 2;
		}

		if (pressedKeys == "8")
		{
			console.log(!caps_lock);
			caps_lock = !caps_lock;
		}

		if(pressedKeys == "9")
		{
			var textAreaTxt = activeElement.value;
			var iCaretPos = activeElement.selectionStart
			var left = textAreaTxt.slice(0,iCaretPos-1);
			var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
			activeElement.value = left+right
			setCaretPosition(activeElement,iCaretPos-1);
		}

		if(pressedKeys == "89")
		{
			var textAreaTxt = activeElement.value;
			var iCaretPos = activeElement.selectionStart;
			var words = textAreaTxt.slice(0,iCaretPos).split(" ");
			var last_word = words.slice(-1)[0];
			var left = textAreaTxt.slice(0,iCaretPos-(last_word.length));
			var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
			activeElement.value = left+right
			setCaretPosition(activeElement,iCaretPos-(last_word.length));
		}

		// ##########################################
			//Abbreviation expansion
		if (pressedKeys == "7" && simple_mode == 0)
		{
			try
			{
				var textAreaTxt = activeElement.value;
				var iCaretPos = activeElement.selectionStart;
				var words = textAreaTxt.slice(0,iCaretPos).split(" ");
				var last_word = words.slice(-1)[0];

				if (compleate_abbreviations_map[current_language][last_word.toLowerCase()])
				{
					console.log(compleate_abbreviations_map[current_language][last_word.toLowerCase()]);
					var left = textAreaTxt.slice(0,iCaretPos-(last_word.length));
					var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));

					if(caps_lock)
						activeElement.value = (left+compleate_abbreviations_map[current_language][last_word].toUpperCase()+right)
					else
						activeElement.value = (left+compleate_abbreviations_map[current_language][last_word]+right)

					if(right.length > 0)
						setCaretPosition(activeElement,iCaretPos+(compleate_abbreviations_map[current_language][last_word].length-1));
					else
						setCaretPosition(activeElement,iCaretPos+(compleate_abbreviations_map[current_language][last_word].length));

					braille_letter_map_pos = 1;
				}
			}
			catch(e)
			{
				console.log(e);
			}
		}


		try
		{
			if (compleate_languages_map[current_language][pressedKeys][braille_letter_map_pos])
			{
				console.log(pressedKeys,compleate_languages_map[current_language][pressedKeys][braille_letter_map_pos]);
				if(caps_lock)
					insertAtCaret(activeElement,compleate_languages_map[current_language][pressedKeys][braille_letter_map_pos].toUpperCase());
				else
					insertAtCaret(activeElement,compleate_languages_map[current_language][pressedKeys][braille_letter_map_pos]);
				braille_letter_map_pos = 1;
			}

		}
		catch(e)
		{
			console.log(e);
		}

	}
	pressedKeys = "";
	event.preventDefault();	
}

function key_press(event) {
	// 32 - Space
	console.log(event.keyCode);
	if(event.keyCode == 32){
	braille_letter_map_pos = 0;
	insertAtCaret(event.target," ");
	}

	for (var key in keycode_map) {
		if (keycode_map.hasOwnProperty(key)) {
			if(keycode_map[key] == event.keyCode){
				pressedKeys=pressedKeys+key;
			}
		}
	}
	event.preventDefault();
}


	function hasTextChanged() {
		var active = document.activeElement;
		var oldValue = $(active).data('braille-input-value');
		var newValue = $(active).val();
		if (oldValue != newValue) {
			$(active).data('braille-input-value', active.value);
			return true;
		}
		return false;
	}


	listenDocumentEvents();
})();

