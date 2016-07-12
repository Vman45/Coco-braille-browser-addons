(function() {
	var isHovering=false;
	
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action == "LanguageSelect") {
			initVarnam(request.language, request.server);
		} 
		else if (request.action == 'VarnamEnable') {
			if(!request.enable){
				disableVarnam();
			}else{
				if(!request.language || request.Language == ''){
					alert("Error while enabling braille. Default language is not set. Click on the language name or set a default language from the preferences screen (Menu -> Settings -> Extensions -> Varnam -> Options) before enabling braille");
					return;
				}
				initVarnam(request.language, request.server);
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



	function initVarnam(data, server) {
		var active = window.document.activeElement;
		if (active) {
			$(active).data('braille-lang', data);
			$(active).data('braille-server', server);
			$(active).data('braille-input-value', active.value);

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

function key_release(event) {
	//var event = $.event.fix(e);
	activeElement = event.target;
	console.log("Key Released"+activeElement.items);
	if(activeElement.items != ""){
		activeElement.items = activeElement.items.split("");
		activeElement.items = activeElement.items.sort( case_insensitive_comp )
		activeElement.items = activeElement.items.join("");
		console.log(activeElement.items);		

		if(activeElement.items == "F"){
			activeElement.value = activeElement.value+"a";
		}	
		if(activeElement.items == "DF"){
			activeElement.value = activeElement.value+"b";
		}
		if(activeElement.items == "FS"){
			activeElement.value = activeElement.value+"k";
		}
		if(activeElement.items == "DFS"){
			activeElement.value = activeElement.value+"l";
		}
		if(activeElement.items == "FJ"){
			activeElement.value = activeElement.value+"c";
		}
		if(activeElement.items == " ")
		{
			activeElement.value = activeElement.value+" ";
		}	
	}
	activeElement.items="";
	event.preventDefault();	
}

function key_press(event) {
	//var event = $.event.fix(e);
	activeElement = event.target;
	activeElement.items=activeElement.items+String.fromCharCode(event.keyCode)
	console.log("Key pressed");
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

