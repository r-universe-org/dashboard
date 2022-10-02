const skiptopics = ['r', 'rstats', 'package', 'cran', 'r-stats', 'r-package'];
const exampletopics = ['maps', 'bayesian', 'ecology', 'climate', 'genome', 'gam',
  'spatial', 'database', 'pdf', 'shiny', 'rstudio', 'machine learning', 'prediction',
  'birds', 'fish', 'sports']

const searchfields = {
  'package' : 'exact package name',
  'owner' : 'github user/organization of the package repository',
  'contributor' : 'contributor (github username)',
  'author' : 'author name (free text)',
  'maintainer' : 'maintainer name (free text)',
  'topic' : 'keyword/topic label',
  'needs' : 'packages that transitively depend on this package',
  'exports' : 'name of a function or dataset in the package'
}

$(function(){

  function build_search_fields(){
    var searchdiv = $("#extra-search-fields");
    for (const field in searchfields) {
      var item = $("#templatezone .search-field-item").clone();
      var idname = `search-item-${field}`;
      item.find("label").attr("for", idname).text(field)
      item.find("input").attr("id", idname).attr("data-field", field).attr("placeholder", searchfields[field]).change(function(){
        var fieldname = $(this).attr("data-field");
        var fieldvalue = $(this).val().trim().replace(/\s+/g, '+');
        var query =  fieldvalue ? `${fieldname}:${fieldvalue}` : "";
        var re = new RegExp(`${fieldname}:(\\S+)`, "i");
        var oldquery = $('#search-input').val();
        if(oldquery.match(re)){
          newquery = oldquery.replace(re, query);
        } else {
          newquery = `${oldquery} ${query}`;
        }
        $('#search-input').val(newquery.trim());
        update_hash();
      }).keypress(function(e){
        if(e.keyCode === 13){
          //close panel on enter key
          searchdiv.collapse('hide');
        }
      });
      item.appendTo(searchdiv);
      searchdiv.on('shown.bs.collapse', function(){
        populate_search_fields();
      });
    }
    var closelink = $("<a>").attr("href", "#").text("close").addClass("float-right").click(function(e){
      e.preventDefault();
      searchdiv.collapse('hide');
    });
    searchdiv.append($("<span>").append(closelink));
  }

  function populate_search_fields(){
    if(!$("#extra-search-fields").hasClass('show')) return;
    $(".search-item-input").val("");
    var re = new RegExp(`(\\S+):(\\S+)`, "ig");
    var matches = $('#search-input').val().match(re);
    if(!matches) return;
    matches.forEach(function(item){
      var out = item.split(":");
      if(out.length == 2){
        var field = out[0].toLowerCase();
        $(`#search-item-${field}`).val(out[1].replace(/[+]/g, ' '));
      }
    });
  }

  function a(link, txt){
    return $('<a>').text(txt || link).attr('href', link);
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
    var maintainer = pkg.maintainer || {};
    if(maintainer.login) {
      item.find('.package-maintainer').attr('href', `https://${maintainer.login}.r-universe.dev`);
    }
    item.find('.package-link').attr('href', `https://${org}.r-universe.dev/ui#package:${pkg.Package}`);
    item.find('.package-name').text(pkg.Package);
    item.find('.package-maintainer').text(maintainer.name);
    item.find('.package-title').text(pkg.Title);
    item.find('.package-description').text(pkg.Description.replace('\n', ' '));
    if(pkg.updated){
      item.find('.description-last-updated').text('Last updated ' + pretty_time_diff(pkg.updated));
    }
    if(pkg.stars){
      item.find('.description-stars').removeClass('d-none').append(` ${pkg.stars} stars`);
    }
    if(pkg.rundeps){
      item.find('.description-dependencies').removeClass('d-none').append(` ${pkg.rundeps.length} dependencies`);
    }
    if(pkg._usedby){
      item.find('.description-dependents').removeClass('d-none').append(` ${pkg._usedby} dependents`);
    }
    item.find('.description-pkgscore').removeClass('d-none').append(` ${Math.pow(pkg._score-1, 2).toFixed(2)} score`);
    if(pkg.match){
      item.find('.description-score').removeClass('d-none').append(` ${pkg.match.toFixed(1)} match`);
    }
    item.find('.package-image').attr('src', avatar_url(pkg['_owner'], 140));
    item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
    item.find('.package-org').toggleClass("d-none").append(a(`https://${org}.r-universe.dev`, org));
    var topics = pkg.topics || [];
    if(pkg.sysdeps){
      topics = topics.concat(pkg.sysdeps);
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
    get_path('https://r-universe.dev/stats/powersearch?limit=50&all=true&q=' + q).then(function(x){
      if(!x.total){
        $('#search-results-comment').text(`No results for "${decodeURIComponent(q)}"`);
      } else {
        $('#search-results-comment').text(`Showing ${x.results.length} of total ${x.total} results\n`);
      }
      var qlink = $('<a href="#"><small>(show query)</small></a>').appendTo('#search-results-comment');
      qlink.click(function(e){
        e.preventDefault();
        $(this).hide();
        $('#search-results-comment').append($("<code>").text(JSON.stringify(x.query)));
      });
      x.results.forEach(show_pkg_card);
    });
  };

  function on_hash_change(e){
    $('#search-input').val(decodeURIComponent(get_hash()));
    populate_search_fields();
    update_results();
  }

  $(window).on('hashchange', on_hash_change);

  $('#search-button').click(function(){
    $(this).blur();
    $("#extra-search-fields").collapse('hide');
    window.location.hash="";
    update_hash();
  });

  //init page first
  var hash = get_hash();
  if(hash.length > 1){
    on_hash_change();
  } else {
    $('#search-input').focus();
  }

  //install listeners
  const update_hash = function(){
    window.location.hash = encodeURIComponent($("#search-input").val());
  };
  $('#search-input').on("keydown paste input", debounce(update_hash));
  exampletopics.forEach(append_topic);
  const more = $('<a>').attr('href', '#').text("... (more popular topics)").click(load_all_topics);
  $('#topics-list').append(more);
  build_search_fields();
  load_summary_stats();
  load_maintainers();
});

function append_topic(topic, i){
  if(skiptopics.includes(topic)) return;
  var quotedtopic = topic.includes("-") ? `"${topic}"` : encodeURIComponent(topic);
  $("<a>").addClass("text-secondary font-weight-bold font-italic").attr("href", '#' + quotedtopic).text(topic).appendTo('#topics-list');
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
  item.find('.card-img-top').attr('src', avatar_url(x.login, 224));
  item.find('.card-text').text(x.name);
  item.find('.card').attr('href', `https://${x.login}.r-universe.dev`);
  return item;
}

function organization_card(x){
  var item = $("#templatezone .maintainer-item").clone();
  item.find('.card-img-top').attr('src', avatar_url(x.universe, 224));
  item.find('.card-text').text(x.universe);
  item.find('.card').attr('href', `https://${x.universe}.r-universe.dev`);
  return item;
}

function load_maintainers(){
  var pages = 8;
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

function avatar_url(login, size){
  // use generic avatars for gitlab/bitbucket
  if(login.startsWith('gitlab-')) login = 'gitlab';
  if(login.startsWith('bitbucket-')) login = 'atlassian';
  login = login.replace('[bot]', '');
  return `https://r-universe.dev/avatars/${login}.png?size=${size}`;
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
