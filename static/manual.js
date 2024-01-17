/* Toggle between fixed and full page width */
addEventListener("keydown", function(e){
	if(e.key == 'w'){
		var val = document.body.style.maxWidth ?  "" : "none";
		console.log("Setting body max-width to", val)
		document.body.style.maxWidth = val;
	}
});
