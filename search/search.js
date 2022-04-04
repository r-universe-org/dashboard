const skiptopics = ['r', 'rstats', 'package', 'cran', 'r-stats', 'r-package'];
const exampletopics = ['maps', 'bayesian', 'ecology', 'climate', 'genome', 'gam',
  'spatial', 'database', 'pdf', 'shiny', 'rstudio', 'machine learning', 'prediction',
  'birds', 'fish', 'sports']

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

  function show_pkg_card(pkg, i){
    var org = pkg['_user'];
    var item = $("#templatezone .package-description-item").clone();
    var login = pkg['_builder'].maintainer.login;
    if(login) {
      item.find('.package-maintainer').attr('href', `https://${login}.r-universe.dev`);
    }
    item.find('.package-link').attr('href', `https://${org}.r-universe.dev/ui#package:${pkg.Package}`);
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
    item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
    item.find('.package-org').toggleClass("d-none").append(a(`https://${org}.r-universe.dev`, org));
    var builder = pkg['_builder'];
    var topics = builder.gitstats && builder.gitstats.topics || [];
    if(builder.sysdeps){
      builder.sysdeps.forEach(function(x){
        if(x.name && !topics.includes(x.name)){
          topics.push(x.name)
        }
      });
    }
    if(topics && topics.length){
      var topicdiv = item.find('.description-topics').removeClass('d-none');
      if(typeof topics === 'string') topics = [topics]; //hack for auto-unbox bug
      topics.filter(x => skiptopics.indexOf(x) < 0).forEach(function(topic){
        var quotedtopic = topic.includes("-") ? `"${topic}"` : topic;
        var topicurl = `#${quotedtopic}`;
        $("<a>").attr("href", topicurl).addClass('badge badge-info mr-1').text(topic).appendTo(topicdiv);
      });
    }
  }

  function get_hash(){
    return window.location.hash.replace(/^#/, '');
  }

  function update_results(){
    if(!window.location.href.includes('#')){
      $('.search-results').empty();
      $('#results-placeholder').show();
      $('svg').show('fast', () => $('#search-input').focus());
    }
    var q = get_hash();
    if(q.length < 2) return;
    $('.search-results').empty();
    $('#results-placeholder').hide();
    $('svg').hide('fast');
    $(window).scrollTop(0);
    get_ndjson('https://r-universe.dev/stats/search?limit=50&all=true&q=' + q).then(function(x){
      if(x.length == 0){
        $('#package-description-col-one').append($("<p>").text(`No results for "${q}"`));
      }
      x.forEach(show_pkg_card);
    });
  };

  $(window).on('hashchange', function(e) {
    $('#search-input').val(decodeURI(get_hash()));
    update_results();
  });

  $('#search-button').click(function(){
    $(this).blur();
    window.location.hash="";
    update_hash();
  });

  //init page first
  var hash = get_hash();
  if(hash.length > 1){
    $('#search-input').val(decodeURI(hash));
    update_results();
  } else {
    $('#search-input').focus();
  }

  //install listeners
  const update_hash = function(){
    window.location.hash = $("#search-input").val();
  };
  $('#search-input').on("keydown paste input", debounce(update_hash));
  exampletopics.forEach(append_topic);
  const more = $('<a>').attr('href', '#').text("... (more popular topics)").click(load_all_topics);
  $('#topics-list').append(more);
  load_summary_stats();
  load_maintainers();
});

function append_topic(topic, i){
  if(skiptopics.includes(topic)) return;
  $("<a>").addClass("text-secondary font-weight-bold font-italic").attr("href", '#' + topic).text(topic).appendTo('#topics-list');
  $('#topics-list').append(", ");
}

function load_all_topics(){
  $('#topics-list').empty().text("Popular topics: ");
  get_ndjson('https://r-universe.dev/stats/topics?min=3&limit=1000').then(function(topicdata){
    topicdata.map(x => x.topic).forEach(append_topic);
  });
  return false;
}

function maintainer_card(x){
  var item = $("#templatezone .maintainer-item").clone();
  item.find('.card-img-top').attr('src', `https://r-universe.dev/avatars/${x.login}.png`);
  item.find('.card-text').text(x.name);
  item.find('.card').attr('href', `https://${x.login}.r-universe.dev`);
  return item;
}

function organization_card(x){
  var item = $("#templatezone .maintainer-item").clone();
  item.find('.card-img-top').attr('src', `https://r-universe.dev/avatars/${x.universe}.png`);
  item.find('.card-text').text(x.universe);
  item.find('.card').attr('href', `https://${x.universe}.r-universe.dev`);
  return item;
}

function load_maintainers(){
  var pages = 6;
  var pagesize = 12;
  //for maintainers use: 'https://r-universe.dev/stats/maintainers?limit=100'
  get_ndjson('https://r-universe.dev/stats/universes?organization=1').then(function(data){
    data = data.filter(x => x.packages.length > 3);
    for(let i = 0; i < pages; i++) {
      var slide = $("#templatezone .carousel-item").clone();
      var row = slide.find('.maintainer-row');
      for(let j = 0; j < pagesize; j++){
        row.append(organization_card(data[i * pagesize + j]));
      }
      if(i == 0) slide.addClass('active');
      slide.appendTo('.carousel-inner') 
    }
    $(".carousel-control").click(function(){
      $(this).blur();
    })
  });
}

function load_summary_stats(){
  get_ndjson('https://r-universe.dev/stats/summary').then(function(data){
    const stats = data[0];
    Object.keys(stats).forEach(key => $(`#summary-n-${key}`).text(stats[key]));
  });
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
