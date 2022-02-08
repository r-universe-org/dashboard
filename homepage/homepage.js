const color_ok = '#22863a';
const color_bad = '#cb2431';
const color_meh = 'slategrey';

/* Menu example: https://www.codeply.com/p/eDmT9PMWW3 */
$(function(){
  function SidebarCollapse() {
    $('.menu-collapsed').toggleClass('d-none');
    $('#sidebar-container').toggleClass('sidebar-expanded sidebar-collapsed');
    $('.sidebar-separator-title').toggleClass('d-flex');
  }
  $("#sidebar-container").mouseenter(SidebarCollapse);
  $("#sidebar-container").mouseleave(SidebarCollapse);
});

function ndjson_batch_stream(path, cb){
  var start = 0;
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: path,
      xhrFields: {
        // Getting on progress streaming response
        onprogress: function(e){
          var res = e.currentTarget.response;
          var end = res.lastIndexOf('\n');
          if(end > start){
            var batch = res.substring(start, end).split('\n').map(JSON.parse);
            start = end + 1;
            cb(batch);
          }
        }
      }
    }).done(function(){
      resolve();
    }).fail((jqXHR, textStatus) => reject("GET " + path + "\nHTTP "
      + jqXHR.status + "\n\n" + jqXHR.responseText));
  });
}

/* Fill table */
function get_path(path){
  return new Promise(function(resolve, reject) {
    $.ajax(path).done(function(txt){
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

function td(el){
  return $('<td>').append(el);
}

function tr(list){
  var tr = $('<tr>');
  list.forEach(x => tr.append(td(x)))
  return tr;
}

function href(doc){
  if(doc){
    return $('<a>').text(doc.status).attr('href', doc.url);
  }
}

function a(link, txt){
  return $('<a>').text(txt || link).attr('href', link);
}

function docs_icon(pkg, url){
  if(pkg.pkgdocs){
    var i = $("<i>", {class : 'fa fa-book'});
    var a = $("<a>").attr('href', url).append(i).css('margin-left', '5px');
    if(!pkg.registered){
      /* This is a 'remote' package */
      return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', color_meh);
    }
    if(pkg.pkgdocs.match(/succ/i)){
      i.css('color', color_ok);
      a.attr('href', 'https://docs.ropensci.org/' + pkg.package).attr("target", "_blank");
    } else {
      i.css('color', color_bad);
    }
    return $('<span></span>').append(a);
  }
}

function run_icon(run, src){
  if(run.skip)
    return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', 'slategrey');
  if(run.type == 'pending')
    return $('<span></span>')
  var iconmap = {
    src : "linux",
    win : "windows",
    mac : "apple"
  };
  if(run && run.status){
    var i = $("<i>", {class : 'fab fa-' + iconmap[run.type]});
    var a = $("<a>").attr('href', run.url).append(i).css('margin-left', '5px');
    // can be "success" or "Succeeded"
    if(run.status.match(/succ/i)){
      i.css('color', '#22863a');
    } else if(run.type == 'src'){
      i.css('color', '#cb2431');
    } else {
      i.css('color', 'slategrey');
    }
    return $('<span></span>').append(a);
  } else {
    var i = $("<i>", {class : 'fa fa-times'}).css('margin-left', '5px').css('color', '#cb2431');
    var a = $("<a>").attr('href', src.url).append(i);
  }
  return $('<span></span>').append(a);
}

function make_sysdeps(builder, distro){
  if(builder && builder.sysdeps){
    var div = $("<div>").css("max-width", "33vw");
    if(Array.isArray(builder.sysdeps)){
      builder.sysdeps.forEach(function(x){
        var name = x.package;
        var url = 'https://packages.ubuntu.com/' + distro + '/' + name;
        $("<a>").text(name).attr("href", url).appendTo(div);
        var version = x.version.replace(/[0-9.]+:/, '').replace(/[+-].*/, '');
        div.append(" (" + version + ")\t");
      });
    } else {
      div.append(builder.sysdeps);
    }
    return div;
  }
}

Date.prototype.yyyymmdd = function() {
  if(!isNaN(this.getTime())){
    var yyyy = this.getFullYear();
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    return [yyyy, (mm>9 ? '' : '0') + mm, (dd>9 ? '' : '0') + dd].join('-');
  } else {
    return "";
  }
};

async function get_metadata(org){
  console.log("Retrieving metadata for: " + org)
  var url = 'https://raw.githubusercontent.com/r-universe/' + org + '/master/.metadata.json';
  const response = await fetch(url);
  if (response.ok)
    return response.json();
  throw new Error("HTTP Error: " + response.status)
}

var crandata = {};
function attach_cran_badge(org, name, url, el){
  crandata[org] = crandata[org] || get_metadata(org);
  crandata[org].then(function(pkgs){
    var row = pkgs.find(x => x.package == name);
    if(row && row.oncran !== undefined){
      var oncran = row.oncran;
      var icon = $("<i>").addClass(oncran ? "fa fa-award" : "fa fa-question-circle popover-dismiss").
      css('color', oncran ? color_ok : color_bad);
      var cranlink = $("<a>")
      cranlink.
      attr("href", "https://cran.r-project.org/package=" + name).
      attr("target", "_blank").
      css("margin-left", "5px").
      css("margin-right", "10px").
      append(icon);
      el.after(cranlink);
      if(url.substring(0,27) == 'https://github.com/r-forge/'){
        url = 'https://r-forge.r-project.org';
      }
      var tiptext = oncran ? "Verified CRAN package!" : "A package '" + name + "' exists on CRAN but description does not link to:<br/><u>" + url + '</u>. This could be another source.';
      cranlink.tooltip({title: tiptext, html: true});
    }
  }).catch((error) => {
    console.log('Failed to load metadata:', error);
  });
}

function init_packages_table(server, user){
  if(user == 'ropensci') $("#thdocs").text("Docs");
  let tbody = $("#packages-table-body");
  var rows = {};
  var universes = [];
  var firstpkg;
  ndjson_batch_stream(server + '/stats/builds?all=true', function(batch){
    batch.forEach(function(pkg, i){
      var org = pkg.user;
      if(universes.indexOf(org) < 0){
        universes.push(org);
        firstpkg = firstpkg || pkg.package;
        update_syntax_block(universes, firstpkg, user);
      }
      var name = pkg.package;
      var src = pkg.runs && pkg.runs.find(x => x.type == 'failure') || pkg.runs.find(x => x.type == 'src') || {};
      var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'unix'}; //{type:'pending'};
      var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'windows'}; //{type:'pending'};
      var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'unix'};
      var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'windows'};
      var builddate = new Date(src.date || NaN).yyyymmdd();
      var commiturl = `${pkg.upstream}/commit/${pkg.commit}`;
      var commitdate = new Date(pkg.timestamp * 1000 || NaN).yyyymmdd();
      var sysdeps = make_sysdeps(pkg, src.distro);
      var upstream = pkg.upstream.toLowerCase().split("/");
      var owner = upstream[upstream.length - 2];
      var longname = owner == user ? pkg.package : `${owner}/${pkg.package}`;
      var pkglink = $("<a>").text(longname).attr("href", pkg.upstream).attr("target", "_blank");
      if(!pkg.registered){
        pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(via remote)"));
      }
      if(pkg.os_restriction){
        pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(" + pkg.os_restriction + " only)"));
      }
      if(src.type){
        var docslink = (user == 'ropensci') ? docs_icon(pkg, src.url) : "";
        var maintainerlink = pkg.maintainerlogin ? $("<a>").attr("href", "https://" + pkg.maintainerlogin + ".r-universe.dev") :  $("<span>")
        maintainerlink.text(pkg.maintainer).addClass('text-secondary');
        var row = tr([commitdate, pkglink, pkg.version, maintainerlink, docslink, run_icon(src, src), builddate,
          [run_icon(win, src), run_icon(mac, src)], [run_icon(oldwin, src), run_icon(oldmac, src)], sysdeps]);
        if(src.type === 'failure'){
          pkglink.css('text-decoration', 'line-through').after($("<a>").attr("href", src.url).append($("<small>").addClass('pl-1 font-weight-bold').text("(build failure)").css('color', 'red')));
        } else {
          attach_cran_badge(org, name, pkg.upstream, pkglink);
        }
        rows[name] ? rows[name].after(row) : tbody.append(row);
        rows[name] = row;
      } else {
        console.log("Not listing old win/mac binaries: " + name + " " + pkg.version )
      }
    });
  }).then(function(){
    if(universes.length){
      $("#package-builds-placeholder").hide();
    } else {
      $("#package-builds-placeholder").text("No packages found in this username.");
    }
  }).catch(alert);
};

function update_registry_status(ghuser, server){
  const tooltip_success = "Universe registry is up to date";
  const tooltip_failure = "There was a problem updating the registry. Please inspect the log files.";
  const url = server + '/gh/repos/r-universe/' + ghuser + '/actions/workflows/sync.yml/runs?per_page=1&status=completed';
  $("#registry-status-link").attr("href", 'https://github.com/r-universe/' + ghuser + '/actions/workflows/sync.yml');
  return get_json(url).then(function(data){
    const success = data.workflow_runs[0].conclusion == 'success';
    if(data && data.workflow_runs && data.workflow_runs.length) {
      $("#registry-status-icon")
      .addClass(success ? 'fa-check' : 'fa-exclamation-triangle')
      .addClass(success ? 'text-success' : 'text-danger')
      .tooltip({title: success ? tooltip_success : tooltip_failure});
      $("#github-user-universe").append(a('https://github.com/r-universe/' + ghuser, "r-universe/" + ghuser));
    } else {
      throw "Failed to get workflow data";
    }
  }).catch(function(err){
    $("#github-user-universe").append("No personal package repository");
    $("#github-user-universe-row").addClass("text-secondary");
    //$("#registry-status-icon").addClass('fa-times').addClass('text-danger');
    console.log(err);
  }).finally(function(e){
    $("#registry-status-spinner").hide();
  });
}

function init_github_info(ghuser, server){
  $("head title").text("R-universe: " + ghuser);
  $(".title-universe-name").text(ghuser);
  $("#github-user-avatar").attr('src', 'https://r-universe.dev/avatars/' + ghuser + '.png');
  $("#rss-feed").attr("href", server + '/feed.xml');
  jQuery.get(`https://r-universe.dev/avatars/${user}.keys`).done(function(res){
    if(res.length){
      $("#github-user-keys").toggleClass("d-none").attr('href', `https://github.com/${user}.keys`);
    }
  });
  return get_json(server + '/gh/users/' + ghuser).then(function(user){
    $("#github-user-name").text(user.name || ghuser);
    $("#github-user-bio").text(user.bio);
    if(user.company){
      $("#github-user-company").toggleClass("d-none").find('.content').text(user.company);
    }
    if(user.location){
      $("#github-user-location").toggleClass("d-none").find('.content').text(user.location);
    }
    if(user.blog){
      var blog = user.blog.startsWith("http") ? user.blog : "https://" + user.blog;
      $("#github-user-blog").toggleClass("d-none").find('.content').append(a(blog));
    }
    if(user.twitter_username){
      $("#github-user-twitter").toggleClass("d-none").attr('href', 'https://twitter.com/' + user.twitter_username);
    }
    update_registry_status(ghuser, server);
  }).catch(alert);
}

function add_maintainer_icon(maintainer){
  var item = $("#templatezone .maintainer-item").clone();
  item.find('.maintainer-name').text(maintainer.name)
  if(maintainer.login){
    item.find('.maintainer-link').attr('href', 'https://' + maintainer.login + '.r-universe.dev');
    item.find('.maintainer-avatar').attr('src', 'https://r-universe.dev/avatars/' + maintainer.login + '.png?size=140');
  } else {
    item.find('.maintainer-avatar').tooltip({title: `<${maintainer.emails}> not associated with any GitHub account.`});
  }
  item.appendTo('#maintainer-list');
}

function init_maintainer_list(user, server){
  get_ndjson(server + '/stats/maintainers?all=true').then(function(x){
    function order( a, b ) {
      if(a.count < b.count) return 1;
      if(a.count > b.count) return -1;
      return 0;
    }
    x.sort(order).forEach(function(maintainer){
      if(maintainer.login == user && maintainer.orcid){
        $("#github-user-orcid").toggleClass("d-none").attr('href', 'https://orcid.org/' + maintainer.orcid);
      }
      if(maintainer.login == user && maintainer.emails && maintainer.emails.length){
        $("#github-user-emails").toggleClass("d-none").find(".content").append(maintainer.emails.join("<br/>"));
        $("#github-user-emails").tooltip({title: `Maintainer email address from package descriptions`});
      }
      if(maintainer.login == user && maintainer.orgs){
        maintainer.orgs.filter(org => org != user).forEach(org => add_maintainer_icon({login: org, name: org}));
      }
      if(maintainer.login != user && maintainer.login != 'test'){
        add_maintainer_icon(maintainer);
      };
    });
  });
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

function pretty_dependencies(pkg){
  return pkg['_hard_deps'].map(x => x.package).join(', ');
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

function init_package_descriptions(server, user){
  function add_badge_row(name, org){
    var tr = $("<tr>").appendTo(name.startsWith(":") ? $("#badges-table-body1") : $("#badges-table-body2"));
    const badge_url = "https://" + org + ".r-universe.dev/badges/" + name;
    const badge_text = "https://" + org + ".r-universe.dev/badges/<b>" + name + "</b>";
    $("<td>").append($("<a>").attr("target", "_blank").attr("href", badge_url).append(badge_text).addClass('text-monospace')).appendTo(tr);
    $("<td>").append($("<img>").attr("data-src", badge_url).addClass("lazyload")).appendTo(tr);
    const md_icon = $('<a class="fab fa-markdown fa-lg">');
    const tooltip_text = 'Copy to clipboard';
    md_icon.tooltip({title: tooltip_text, placement: 'left'});
    md_icon.on("click", function(e){
      const text = `[![${name} status badge](${badge_url})](https://${org}.r-universe.dev)`;
      navigator.clipboard.writeText(text).then(function(e){
        md_icon.attr('data-original-title', 'Copied!').tooltip('show');
        md_icon.attr('data-original-title', tooltip_text);
      });
    });
    $("<td>").append(md_icon).appendTo(tr);
  }
  //$('#packages-tab-link').one('shown.bs.tab', function (e) {
  get_ndjson(server + '/stats/descriptions?all=true').then(function(x){
    if(x.find(pkg => pkg['_user'] == user)){
      add_badge_row(":name", user);
      add_badge_row(":registry", user);
      add_badge_row(":total", user);
    }
    x.forEach(function(pkg, i){
      //console.log(pkg)
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
      item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
      attach_cran_badge(org, pkg.Package, buildinfo.upstream, item.find('.cranbadge'));
      add_badge_row(pkg.Package, org);
      if(org != user){
        item.find('.package-org').toggleClass("d-none").append(a(`https://${org}.r-universe.dev`, org));
      }
    });
    if(x.length){
      $("#package-description-placeholder").hide();
    } else {
      $("#package-description-placeholder").text("No packages found in this username.");
    }
    lazyload();
  });
  //});
}

function navigate_iframe(state){
  if(window.iframestate !== state){
    var iframe = frames['viewerframe'];
    iframe.location.replace(state ? server + "/articles/" + state : 'about:blank');
    window.iframestate = state;
    console.log('Navigating iframe to: ' + state);
    update_article_info();
    if(state){
      document.getElementById('viewerframe').onload=function(){$('#article-placeholder').hide()};
      $('#article-placeholder').show();
    }
  }
}

window.articledata = {};
function update_article_info(){
  var pkg = articledata[window.iframestate];
  if(pkg){
    $('#article-info-author').text(pkg.vignette.author || pkg.maintainer.split("<")[0]);
    if(!pkg.vignette.author && pkg.login){
      $('#article-info-author').attr("href", `https://${pkg.login}.r-universe.dev`);
    } else {
      $('#article-info-author').removeAttr("href");
    }
    $('#article-info-package').text(pkg.package + " " + pkg.version);
    $('#article-info-source').attr('href', server + "/articles/" + pkg.package + '/' + pkg.vignette.source).text(pkg.vignette.source);
    $('#article-info-html').attr('href', server + "/articles/" + pkg.package + '/'+ pkg.vignette.filename).text(pkg.vignette.filename);
    $('#article-info-date').text((pkg.vignette.modified || "??").substring(0, 10));
  }
}

function init_article_list(server, user){
  iFrameResize({ log: false, checkOrigin: false }, '#viewerframe');
  //$('#articles-tab-link').one('shown.bs.tab', function (e) {
    get_ndjson(server + '/stats/vignettes?all=true').then(function(x){
      function order( a, b ) {
        if(a.vignette.modified < b.vignette.modified) return 1;
        if(a.vignette.modified > b.vignette.modified) return -1;
        return 0;
      }
      x.sort(order).forEach(function(pkg, i){
        var item = $("#templatezone .article-item").clone();
        var minilink = pkg.package + "/" + pkg.vignette.filename;
        articledata[minilink] = pkg;
        if(pkg.user == user){
          item.attr("href", server + "/articles/" + minilink);
        } else {
          item.attr("href", "https://" + pkg.user + ".r-universe.dev/articles/" + minilink);
        }
        if(!pkg.vignette.filename.endsWith('html')){
          item.attr("target", "_blank")
        } else {
          item.click(function(e){
            e.preventDefault();
            if(pkg.user == user){
              navigate_iframe(minilink);
              $("#view-tab-link").tab('show');
              window.scrollTo(0,0);
            } else {
              window.location.href = `https://${pkg.user}.r-universe.dev/ui#view:${minilink}`;
            }
          });
        }
        item.find('.article-title').text(pkg.vignette.title);
        item.find('.article-package-version').text(pkg.package + " " + pkg.version);
        item.find('.article-author-name').text(pkg.vignette.author || pkg.maintainer.split("<")[0]);
        item.find('.article-modified').text('Last update: ' + (pkg.vignette.modified || "??").substring(0, 10));
        item.find('.article-created').text('Started: ' + (pkg.vignette.created || "??").substring(0, 10));
        if(pkg.user != user){
          item.find('.article-author-name').append(`<i>(via <a href="https://${pkg.user}.r-universe.dev">${pkg.user}</a>)</i>`);
        }
        var img = item.find('.maintainer-avatar').attr('src', get_package_image(pkg));
        if(pkg.pkglogo)
          img.removeClass('rounded-circle');
        item.appendTo('#article-list-group');
      });
      if(x.length){
        $("#article-list-placeholder").hide();
      } else {
        $("#article-list-placeholder").text("No rmarkdown vignettes found in this universe.");
      }
      update_article_info();
    });
  //});
}

function update_syntax_block(universes, package, user){
  var text = `# Enable universe(s) by ${user}
  options(repos = c(`;
  for (const org of universes) {
    var cleanorg = org.replace(/\W/g, '');
    text = text + `\n    ${cleanorg} = 'https://${org}.r-universe.dev',`;
  }
  text = text +`\n    CRAN = 'https://cloud.r-project.org'))

  # Install some packages
  install.packages('${package}')`;
  var code = $("<code>").addClass("language-r").text(text.replaceAll("\n  ", "\n"));
  $('#example-install-code').empty().append(code);
  Prism.highlightAll();
}

/* Tab history: https://github.com/jeffdavidgreen/bootstrap-html5-history-tabs */
+(function ($) {
  'use strict';
  $.fn.historyTabs = function () {
    var that = this;

    /* Create back-button handler */
    window.addEventListener('popstate', function (event) {
      if (event.state) {
        navigate_iframe(event.state.view);
        $(that)
        .filter('[href="' + event.state.tab + '"]')
        .tab('show');
      }
    });
    return this.each(function (index, element) {
      var tab = $(this).attr('href');

      /* On each tab click */
      $(element).on('show.bs.tab', function () {
        var stateObject = {
          tab: tab,
          view: tab == '#view' ? window.iframestate : null,
        };
        var url = tab;
        if (tab == '#view') {
          url = tab + ":" + window.iframestate;
        } else {
          navigate_iframe(null);
        }

        if (window.location.hash && url !== window.location.hash) {
          window.history.pushState(
            stateObject,
            document.title,
            window.location.pathname + url
            );
        } else {
          window.history.replaceState(
            stateObject,
            document.title,
            window.location.pathname + url
            );
        }
      });

      /* Once on page load */
      if (tab === '#view' && window.location.hash.startsWith("#view:")){
        navigate_iframe(window.location.hash.substring(6));
        $(element).tab('show');
      } else if (!window.location.hash && $(element).is('.active')) {
      // Shows the first element if there are no query parameters.
      $(element).tab('show').trigger('show.bs.tab');
    } else if (tab === window.location.hash) {
      $(element).tab('show');
    }
  });
  };
})(jQuery);


//INIT
var devtest = 'ropensci'
var host = location.hostname;
var user = host.endsWith("r-universe.dev") ? host.split(".")[0] : devtest;
var server = host.endsWith("r-universe.dev") ? "" : 'https://' + user + '.r-universe.dev';
init_github_info(user, server).then(function(){init_maintainer_list(user, server)});
init_packages_table(server, user);
init_package_descriptions(server, user);
init_article_list(server, user);

$('a[data-toggle="tab"]').historyTabs();
