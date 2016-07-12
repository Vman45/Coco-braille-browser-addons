
self.port.on('initBraille', initBraille);
self.port.on('disableBraille', disableBraille);
self.port.on('enableOrDisable', enableOrDisable);
self.port.on('set_languages_map', set_languages_map);
self.port.on('set_abbreviations_map', set_abbreviations_map);
self.port.on('set_available_languages', set_available_languages);
self.port.on('set_contractions_dict', set_contractions_dict);
self.port.on('set_keycode_map', set_keycode_map);
self.port.on('set_simple_mode', set_simple_mode);


var compleate_languages_map = [];

var compleate_abbreviations_map = [];

var available_languages = [];

var compleate_contractions_dict = [];

var current_language = 0;

var caps_lock = 0;

var keycode_map = {"1":"70","2":"68","3":"83","4":"74","5":"75","6":"76","7":"65","8":"71","9":"72","0":"186","0":"59","-1":"18"};

var pressedKeys = "";

var braille_letter_map_pos = 0;

var simple_mode = 0;

function set_available_languages(languages){
	available_languages = languages;
}

function set_languages_map(map){
	compleate_languages_map = map;
}

function set_abbreviations_map(map){
	compleate_abbreviations_map = map;
}

function set_contractions_dict(dict){
	compleate_contractions_dict = dict;
}

function set_simple_mode(value){
	simple_mode = value;
}

function set_keycode_map(map){
	keycode_map = map;
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
		console.log(activeElement.items);

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
}


function findElementById(id) {
	var element = document.getElementById(id);
	if (element) return element;

	var frames = document.getElementsByTagName('iframe');
	for (var i = 0; i < frames.length; i++) {
		var frame = frames[i];
		try {
			element = frame.contentDocument.documentElement.getElementById(id);
			if (element) return element;
		}
		catch(e) {}
	}

	return null;
}

function initBraille(data) {
	var active = findElementById(data.id);
	
	console.log("Language = ",data);
	current_language = available_languages.indexOf(data.data);
	console.log("Language index = ",current_language);

	if (!active) {
		active = document.activeElement;
		if (active.localName != 'textarea' && active.localName != 'input') {
			console.log('Unable to init Braille. Varnam can be initialized only on a textarea and input');
			return;
		}
	}

	if (active != document.body) {
		active.setAttribute('data-braille-lang', data.data);
		active.setAttribute('data-braille-input-value', active.value);



		/*$(active).off('keydown', keydown);
		$(active).on('keydown', keydown);
		$(active).off('keyup', keyup);
		$(active).on('keyup', keyup);*/
		
		console.log("Connecting on keydown event handlers");
		active.items = "";
		
		active.addEventListener('keyup', function(event) {
			//self.port.emit('keypress', event.target.toString());
			key_release(event);
			event.stopPropagation();
			event.preventDefault();
			}, false);

		active.addEventListener('keydown', function(event) {
			//self.port.emit('keypress', event.target.toString());
			key_press(event);
			event.stopPropagation();
			event.preventDefault();
			}, false);
		
	}
}


function disableBraille(data) {
	var active = findElementById(data.id);
	if (!active) {
		active = document.activeElement;
	}
	if (active != document.body) {
		active.removeAttribute('data-braille-lang');
		active.removeAttribute('data-braille-input-value');
		$(active).off('keydown', keydown);
		$(active).off('keyup', keyup);
	}
}

function getCurrentLanguage() {
	var lang = document.activeElement.getAttribute('data-braille-lang');
	return lang;
}

function enableOrDisable(data) {
    var isVarnamEnabled = (getCurrentLanguage() !== null);
    var data = {};
    if (isVarnamEnabled) {
        data = {data: 'disable', id: document.activeElement.id}
    }
    else {
        data = {data: 'enable', id: document.activeElement.id}
    }

    self.port.emit("enableOrDisableBraille", data);
}
