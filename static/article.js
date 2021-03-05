/* Bootstrap styles to tables */
function bootstrapStylePandocTables() {
$$('tr.header').parent('thead').parent('table').addClass('table table-condensed'); }
$$(document).ready(function () { bootstrapStylePandocTables(); });

/* Adjust the height when click the toc */
var shiftWindow = function() { scrollBy(0, -60) };
window.addEventListener("hashchange", shiftWindow);
function load() { if (window.location.hash) shiftWindow(); }
