/* Toggle between fixed and full page width */
addEventListener("keydown", function(e){
	if(e.key == 'w'){
		var val = document.body.style.maxWidth ?  "" : "none";
		console.log("Setting body max-width to", val)
		document.body.style.maxWidth = val;
	}
});


/* Temp fix for compatibility with the 'r-arguments-title' class in R.css
   See https://github.com/rstudio/rstudio/pull/13477
   Remove after: https://github.com/ropensci/postdoc/commit/a16918cf5655 */
document.addEventListener('DOMContentLoaded', function() {
	if(!document.body.classList.contains("postdoc")){
		var headers = document.getElementsByTagName('h3');
		for(var i = 0; i < headers.length; i++) {
			if(headers[i].innerText == 'Arguments') {
				headers[i].className = 'r-arguments-title';
			}
		}
	}
});
