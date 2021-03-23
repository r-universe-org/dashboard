$(function(){

  function truncate_dates(x){

  }

  function order_by_created( a, b ) {
    if(a.vignette.created < b.vignette.created) return 1;
    if(a.vignette.created > b.vignette.created) return -1;
    return 0;
  }

  function order_by_modified( a, b ) {
    if(a.vignette.modified < b.vignette.modified) return 1;
    if(a.vignette.modified > b.vignette.modified) return -1;
    return 0;
  }

  function pkg_to_el(pkg){
    var item = $("#templatezone .article-item").clone();
    var universe = "https://" + pkg.universe + ".r-universe.dev";
    item.find('.article-link').attr("href", universe + "/articles/" + pkg.package + "/" + pkg.vignette.filename);
    if(pkg.vignette.filename.endsWith('html')){
      item.find('.article-link').attr("href", universe + "/#view:" + pkg.package + "/" + pkg.vignette.filename);
    } else {
      item.find('.article-link').attr("href", universe + "/articles/" + pkg.package + "/" + pkg.vignette.filename);
      item.attr("target", "_blank");
    }
    item.find('.article-title').text(pkg.vignette.title);
    item.find('.article-package-version').text(pkg.package + " " + pkg.version);
    item.find('.article-author-name').text(pkg.vignette.author || pkg.maintainer.split("<")[0]);
    item.find('.article-modified').text('Last update: ' + pkg.vignette.modified.substring(0, 10));
    item.find('.article-created').text('Started: ' + pkg.vignette.created.substring(0, 10));
    item.find('.article-universe').text('@' + pkg.universe).attr("href", universe + '#articles');
    if(pkg.maintainerlogin){
      item.find('.maintainer-avatar').attr('src', 'https://github.com/' + pkg.maintainerlogin + '.png?size=140');
    }
    return item;
  }

	get_ndjson('https://r-universe.dev/stats/vignettes?limit=500').then(function(res){
    var articles = res.filter(function(x){
      return x.universe != 'test' && x.vignette.created
    });
    articles.sort(order_by_created).slice(0, 250).forEach(function(pkg){
      pkg_to_el(pkg).appendTo('#articles-list-created');
    });
		articles.sort(order_by_modified).slice(0, 250).forEach(function(pkg){
      pkg_to_el(pkg).appendTo('#articles-list-updated');
		});
    $("#placeholder").hide();
		lazyload();
	});
});
