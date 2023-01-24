$(function(){
  get_ndjson('https://r-universe.dev/stats/sysdeps?all=1').then(function(sysdeps){
    sysdeps.filter(x => x.library).forEach(function(x){
      if(x.library === 'c++') return;
      var used = $("<div>").css("max-width", "33vw");
      x.usedby.sort(sortpkg).map(link_package).forEach(function(el, i){
        if(i > 0) used.append(" ");
        used.append(el.addClass("text-dark"));
      })
      var runtime = x.packages.sort().map(dep => href(dep, `https://packages.ubuntu.com/${x.distro}/${dep}`).addClass('text-nowrap text-secondary').append("<br>"))
      var headers = x.headers.sort().map(dep => href(dep, `https://packages.ubuntu.com/${x.distro}/${dep}`).addClass('text-nowrap').append("<br>"));
      var version = trim_version(x.version);
      var row = tr([lib(x), cleanup_desc(x.description), headers, used]);
      $("tbody").append(row);
    });
  });
});

function cleanup_desc(str){
  if(!str) return "";
  var str = str.charAt(0).toUpperCase() + str.slice(1);
  return str.replace(/\(.*\)$/, '').replace('SASL -', 'SASL').replace(/[-,]+ .*(shared|runtime|binary|library|legacy|precision|quantum).*$/i, '');
}

function sortpkg(x, y){
  return x.package.toLowerCase() > y.package.toLowerCase() ? 1 : -1;
}

function th(el){
  return $('<th>').append(el);
}

function td(el){
  return $('<td>').append(el);
}

function tr(list){
  var tr = $('<tr>');
  list.forEach((x,i) => tr.append(i ? td(x) : th(x)))
  return tr;
}

function lib(x){
  var el = $("<span>").addClass('text-nowrap').text(x.library).append(" ");
  if(x.homepage){
    $("<a>").attr("target", "_blank").attr('href', x.homepage).append($("<sup>").addClass("fas fa-external-link-alt")).appendTo(el);
  }
  return el;
}

function trim_version(str){
  return str.replace(/[0-9.]+:/, '').replace(/[+-].*/, '').replace(/\.[a-z]+$/, '');
}

function link_package(x){
  return href(x.package, `https://${x.owner}.r-universe.dev/${x.package}`);
}

function href(txt, url){
  return $('<a>').text(txt).attr('href', url);
}
