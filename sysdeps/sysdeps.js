$(function(){
  get_ndjson('https://r-universe.dev/stats/sysdeps').then(function(sysdeps){
    sysdeps.filter(x => x.library).forEach(function(x){
      var used = $("<div>");
      x.usedby.sort(sortpkg).map(link_package).forEach(function(el, i){
        if(i > 0) used.append(" ");
        used.append(el.addClass("text-dark"));
      })
      var headers = x.headers.map(dep => href(dep, `https://packages.ubuntu.com/${x.distro}/${dep}`).addClass('text-nowrap').append("<br>"))
      var version = trim_version(x.version);
      var row = tr([lib(x.library), version, headers, used])
      $("tbody").append(row);
    });
  });
});

function sortpkg(x, y){
  return x.package.toLowerCase() > y.package.toLowerCase() ? 1 : -1;
}

function td(el){
  return $('<td>').append(el);
}

function tr(list){
  var tr = $('<tr>');
  list.forEach(x => tr.append(td(x)))
  return tr;
}

function lib(str){
  return $("<b>").addClass('text-nowrap').text(normalize_library(str))
}

function normalize_library(str){
  switch(str) {
    case 'libstdc++6':
      return 'c++';
    case 'libgomp1':
      return 'openmp';
    case 'libgfortran5':
      return 'libfortran'
    case 'openjdk-lts':
      return 'openjdk (java)';
    default:
      return str;
  }
}

function trim_version(str){
  return str.replace(/[0-9.]+:/, '').replace(/[+-].*/, '').replace(/\.[a-z]+$/, '');
}

function link_package(x){
  return href(x.package, `https://${x.owner}.r-universe.dev`);
}

function href(txt, url){
  return $('<a>').text(txt).attr('href', url);
}
