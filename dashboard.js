function get_path(path){
    return new Promise(function(resolve, reject) {
        $.get(path).done(function(txt){
            resolve(txt);
        }).fail((jqXHR, textStatus) => reject("GET " + path + "\nHTTP "
           + jqXHR.status + "\n\n" + jqXHR.responseText));
    }); 
}

function get_json(path){
    return get_path(path);
}

function get_ndjson(path){
    return get_path(path).then(txt => txt.split('\n').filter(x => x.length).map(JSON.parse));
}

/* Menu example: https://www.codeply.com/p/eDmT9PMWW3 */
$(function(){
    // Hide submenus
    $('#body-row .collapse').collapse('hide');

    // Collapse/Expand icon
    $('#collapse-icon').addClass('fa-angle-double-left');

    // Collapse click
    $('[data-toggle=sidebar-colapse]').click(function() {
        SidebarCollapse();
    });

    function SidebarCollapse() {
        $('.menu-collapsed').toggleClass('d-none');
        $('.sidebar-submenu').toggleClass('d-none');
        $('.submenu-icon').toggleClass('d-none');
        $('#sidebar-container').toggleClass('sidebar-expanded sidebar-collapsed');
        $('#table-container').toggleClass('table-expanded table-collapsed');

        // Treating d-flex/d-none on separators with title
        var SeparatorTitle = $('.sidebar-separator-title');
        if (SeparatorTitle.hasClass('d-flex')) {
            SeparatorTitle.removeClass('d-flex');
        } else {
            SeparatorTitle.addClass('d-flex');
        }

        // Collapse/Expand icon
        $('#collapse-icon').toggleClass('fa-angle-double-left fa-angle-double-right');
        window.dispatchEvent(new Event('resize'));
    }
});
