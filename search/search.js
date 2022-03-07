$(function(){

  function a(link, txt){
    return $('<a>').text(txt || link).attr('href', link);
  }

  function get_package_image(buildinfo){
    if(buildinfo.pkglogo){
      if(!buildinfo.pkglogo.startsWith('http')){
        var upstream = buildinfo.upstream.replace(/\.git$/, '');
        buildinfo.pkglogo = upstream + '/raw/HEAD/' + buildinfo.pkglogo;
      }
      return buildinfo.pkglogo;
    }
    var ghuser = buildinfo.login || buildinfo.maintainer.login || "r-universe";
    return 'https://r-universe.dev/avatars/' + ghuser + '.png?size=140';
  }

  function pretty_time_diff(ts){
    var date = new Date(ts*1000);
    var now = new Date();
    var diff_time = now.getTime() - date.getTime();
    var diff_hours = Math.round(diff_time / (1000 * 3600));
    var diff_days = Math.round(diff_hours / 24);
    if(diff_hours < 24){
      return diff_hours + " hours ago"
    } else if(diff_days < 31){
      return diff_days + " days ago";
    } else if (diff_days < 365){
      return Math.round(diff_days / 30) + " months ago";
    } else {
      return Math.round(diff_days / 365) + " years ago";
    }
  }

  function show_pkg_card(pkg){
    var org = pkg['_user'];
    var item = $("#templatezone .package-description-item").clone();
    var login = pkg['_builder'].maintainer.login;
    if(login) {
      item.find('.package-maintainer').attr('href', `https://${login}.r-universe.dev`);
    }
    item.find('.package-name').text(pkg.Package);
    item.find('.package-maintainer').text(pkg.Maintainer.split("<")[0]);
    item.find('.package-title').text(pkg.Title);
    item.find('.package-description').text(pkg.Description.replace('\n', ' '));
    //item.find('.package-dependencies').text("Dependencies: " + pretty_dependencies(pkg));
    const buildinfo = pkg['_builder'];
    if(buildinfo.commit.time){
      item.find('.description-last-updated').text('Last updated ' + pretty_time_diff(buildinfo.commit.time));
    }
    item.find('.package-image').attr('src', get_package_image(buildinfo));
    item.appendTo('#search-results');
    //attach_cran_badge(org, pkg.Package, buildinfo.upstream, item.find('.cranbadge'));
    item.find('.package-org').toggleClass("d-none").append(a(`https://${org}.r-universe.dev`, org));
    var topics = pkg['_builder'].gitstats.topics;
    var skiptopics = ['r', 'rstats', 'package', 'cran', 'r-stats', 'r-package'];
    if(topics && topics.length){
      var topicdiv = item.find('.description-topics').removeClass('d-none');
      if(typeof topics === 'string') topics = [topics]; //hack for auto-unbox bug
      topics.filter(x => skiptopics.indexOf(x) < 0).forEach(function(topic){
        $("<a>").addClass('badge badge-info mr-1').text(topic).appendTo(topicdiv);
      });
    }
  }

  $(window).on('hashchange', function(e) {
    update_results();
  });
  $('#search-button').click(function(){
    $(this).blur();
    window.location.hash="";
    update_hash();
  });

  function update_results(){
    var q = window.location.hash.replace(/^#/, '');
    if(q.length < 2) return;
    $('#search-results').empty();
    get_ndjson('https://r-universe.dev/stats/search?limit=50&all=true&q=' + q).then(function(x){
      if(x.length == 0){
        $('#search-results').append($("<p>").text(`No results for "${q}"`));
      }
      x.forEach(show_pkg_card);
    });
  };

  const update_hash = function(){
    window.location.hash = $("#search-input").val();
  };
  $('#search-input').on("keydown paste input", debounce(update_hash));

  //init page
  update_results();
});

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}