const color_ok = '#22863a';
const color_bad = '#cb2431';
const color_meh = 'slategrey';

/* https://weeknumber.com/how-to/javascript */
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

Date.prototype.getWeekYear = function() {
  var date = new Date(this.getTime());
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  return date.getFullYear();
}

Date.prototype.yyyymm = function(){
  const wk = this.getWeek();
  return this.getWeekYear() + '-' + (wk < 10 ? '0' + wk : wk);
}

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
  var count = 0;
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
            count = count + batch.length;
          }
        }
      }
    }).done(function(){
      resolve(count);
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

function docs_ok(pkg){
  return pkg.pkgdocs && pkg.pkgdocs.match(/succ/i);
}

function docs_icon(pkg, url){
  if(pkg.pkgdocs){
    var i = $("<i>", {class : 'fa fa-book'});
    var a = $("<a>").attr('href', url).append(i).css('margin-left', '5px');
    if(!pkg.registered){
      /* This is a 'remote' package */
      return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', color_meh);
    }
    if(docs_ok(pkg)){
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

function is_success(run){
  return run && run.status && run.status.match(/succ/i) || run.type == 'pending';
}

function all_ok(runs){
  return runs.every(is_success);
}

function make_sysdeps(builder, distro){
  if(builder && builder.sysdeps){
    var div = $("<div>").css("max-width", "33vw");
    var unique = {};
    builder.sysdeps.forEach(x => unique[x.name] = x);
    Object.keys(unique).sort().forEach(function(key){
      var x = unique[key];
      //var url = 'https://packages.ubuntu.com/' + distro + '/' + (x.headers || x.package);
      var url = `https://r-universe.dev/search/#${key}`
      $("<a>").text(key).attr("href", url).appendTo(div);
      version = x.version.replace(/[0-9.]+:/, '').replace(/[+-].*/, '').replace(/\.[a-z]+$/, '');
      div.append(" (" + version + ")\t");
    });
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
        //firstpkg = firstpkg || pkg.package;
        //update_syntax_block(universes, firstpkg, user);
      }
      var name = pkg.package;
      var src = pkg.runs && pkg.runs.find(x => x.type == 'failure') || pkg.runs.find(x => x.type == 'src') || {};
      var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.2') || {skip: pkg.os_restriction === 'unix'}; //{type:'pending'};
      var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.2') || {skip: pkg.os_restriction === 'windows'}; //{type:'pending'};
      var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'unix'};
      var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'windows'};
      var builddate = new Date(src.date || NaN).yyyymmdd();
      var commiturl = `${pkg.upstream}/commit/${pkg.commit}`;
      var versionlink = $("<a>").text(pkg.version).attr("href", commiturl).attr("target", "_blank").addClass('text-dark');
      var commitdate = new Date(pkg.timestamp * 1000 || NaN).yyyymmdd();
      var sysdeps = make_sysdeps(pkg, src.distro);
      var upstream = pkg.upstream.toLowerCase().split("/");
      var owner = upstream[upstream.length - 2];
      var longname = owner == user ? name : `${owner}/${name}`;
      var pkglink = $("<a>").text(longname);
      if(src.type !== 'failure'){
        pkglink.attr("href", link_to_pkg(org, name)).click(function(e){
          if(org == user){
            tab_to_package(name);
          }
        });
      }
      if(!pkg.registered){
        pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(via remote)"));
      }
      if(pkg.os_restriction){
        pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(" + pkg.os_restriction + " only)"));
      }
      if(src.type){
        var docslink = (user == 'ropensci') ? docs_icon(pkg, src.url) : "";
        if(!all_ok([src,win,mac,oldwin,oldmac]) || (user == 'ropensci' && !docs_ok(pkg))){
          var rebuildlink = $("<a>").attr("href", src.url).addClass('fa fa-sync-alt').click(function(e){
            e.preventDefault();
            rebuildlink.attr("disabled", true).off('click');
            var type = src.type === 'failure' ? 'failure' : 'src';
            var req = $.ajax({
              type: 'PATCH',
              url: `https://${org}.r-universe.dev/packages/${name}/${pkg.version}/${type}`
            }).done(function() {
              alert(`Success! Retrying failed builds for ${name} ${pkg.version}`)
              window.location = src.url;
            })
            .fail((jqXHR, textStatus) => {
              alert(jqXHR.responseText)
              if(jqXHR.status == 429) window.location = src.url;
            })
            .always(xhr => rebuildlink.tooltip('dispose'));
          });
          rebuildlink.tooltip({title: `Retry failed builds for ${name} ${pkg.version}`});
        }
        var maintainerlink = pkg.maintainerlogin ? $("<a>").attr("href", "https://" + pkg.maintainerlogin + ".r-universe.dev") :  $("<span>")
        maintainerlink.text(pkg.maintainer).addClass('text-secondary');
        var row = tr([commitdate, pkglink, versionlink, maintainerlink, docslink, run_icon(src, src), builddate, rebuildlink,
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
    $("#github-user-universe").append("No personal registry");
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
    if(user.followers){
      let count = user.followers;
      let countstr = count < 1000 ? count : (count/1000).toFixed(1) + 'k';
      $("#github-user-followers").toggleClass("d-none").find('.content').text(countstr + " followers");
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
    item.find('.maintainer-link').attr('target', '_blank').attr('href', 'https://github.com/r-universe-org/help#how-to-link-a-maintainer-email-addresses-to-a-username-on-r-universe');
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

function make_topic_labels(builder){
  var topics = builder.gitstats && builder.gitstats.topics || [];
  if(typeof topics === 'string') topics = [topics]; //hack for auto-unbox bug
  if(builder.sysdeps){
    builder.sysdeps.forEach(function(x){
      if(x.name && !topics.includes(x.name)){
        topics.push(x.name)
      }
    });
  }
  var skiptopics = ['r', 'rstats', 'package', 'cran', 'r-stats', 'r-package'];
  var topicdiv = $("<span>");
  if(topics && topics.length){
    topics.filter(x => skiptopics.indexOf(x) < 0).forEach(function(topic){
      var quotedtopic = topic.includes("-") ? `"${topic}"` : topic;
      var topicurl = `https://r-universe.dev/search#${quotedtopic}`;
      $("<a>").attr("href", topicurl).addClass('badge badge-info mr-1').text(topic).appendTo(topicdiv);
    });
  }
  return topicdiv;
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
  //get_ndjson(server + '/stats/descriptions?all=true').then(function(x){
  var first_page = true;
  ndjson_batch_stream(server + '/stats/descriptions?all=true', function(x){
    if(first_page && x.find(pkg => pkg['_user'] == user)){
      add_badge_row(":name", user);
      add_badge_row(":registry", user);
      add_badge_row(":total", user);
      first_page = false;
    }
    x.forEach(function(pkg, i){
      //console.log(pkg)
      var org = pkg['_user'];
      var item = $("#templatezone .package-description-item").clone();
      var login = pkg['_builder'].maintainer.login;
      if(login) {
        item.find('.package-maintainer').attr('href', `https://${login}.r-universe.dev`);
      }
      item.find('.package-name').text(pkg.Package)
      item.find('.package-link').attr("href", link_to_pkg(org, pkg.Package)).click(function(e){
        if(org == user){
          tab_to_package(pkg.Package);
        }
      });
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
      item.find('.description-topics').append(make_topic_labels(pkg['_builder']));
    });
    $("#package-description-placeholder").hide();
  }).then(function(count){
    if(count > 0) lazyload(); //for badges
    $("#package-description-placeholder").text("No packages found in this username.");
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

function update_article_info(){
  articledatapromise.then(function(data){
    var pkg = data[window.iframestate];
    if(pkg){
      $('#article-info-author').text(pkg.vignette.author || pkg.maintainer.split("<")[0]);
      if(!pkg.vignette.author && pkg.login){
        $('#article-info-author').attr("href", `https://${pkg.login}.r-universe.dev`);
      } else {
        $('#article-info-author').removeAttr("href");
      }
      $('#article-info-package').text(pkg.package + " " + pkg.version).attr("href", `#package:${pkg.package}`).click(function(e){
        tab_to_package(pkg.package);
      });
      $('#article-info-source').attr('href', server + "/articles/" + pkg.package + '/' + pkg.vignette.source).text(pkg.vignette.source);
      $('#article-info-html').attr('href', server + "/articles/" + pkg.package + '/'+ pkg.vignette.filename).text(pkg.vignette.filename);
      $('#article-info-date').text((pkg.vignette.modified || "??").substring(0, 10));
    }
  });
}

function init_article_data(server){
  var data = {};
  return get_ndjson(server + '/stats/vignettes?all=true').then(function(x){
    x.forEach(function(pkg, i){
      var minilink = pkg.package + "/" + pkg.vignette.filename;
      data[minilink] = pkg;
    });
    return data;
  });
}

function init_article_list(data, user){
  function order( a, b ) {
    if(a.vignette.modified < b.vignette.modified) return 1;
    if(a.vignette.modified > b.vignette.modified) return -1;
    return 0;
  }
  var x = Object.keys(data).map(k => data[k]);
  x.sort(order).forEach(function(pkg, i){
    var item = $("#templatezone .article-item").clone();
    var minilink = pkg.package + "/" + pkg.vignette.filename;
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
  var code = $("<code>").addClass("language-r").text(text.replace(/\n  /g, "\n"));
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

    /* This is a last resort, in case of a missing click handler */
    window.addEventListener('hashchange', function (event) {
      if(window.location.hash.startsWith("#package:")){
        tab_to_package(window.location.hash.substring(9));
      }
    });

    return this.each(function (index, element) {
      var tab = $(this).attr('href');

      /* On each tab click */
      $(element).on('show.bs.tab', function () {
        var stateObject = {
          tab: tab,
          view: tab == '#view' ? window.iframestate : null,
          detailpkg: tab == '#view' ? window.detailpkg : null
        };
        var url = tab;
        if (tab == '#view') {
          url = tab + ":" + window.iframestate;
        } else {
          navigate_iframe(null);
        }
        if (tab == '#package') {
          url = tab + ":" + window.detailpkg;
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
      } else if (tab === '#package' && window.location.hash.startsWith("#package:")){
        populate_package_details(window.location.hash.substring(9));
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

function sort_packages(array){
  return array.sort((a, b) => (a.count > b.count) ? -1 : 1);
}

function objectToArray(obj){
  return Object.keys(obj).map(function(key){return {package:key, count: obj[key]}});
}

function activity_data(updates){
  const now = new Date();
  const weeks = Array(53).fill(0).map((_, i) => new Date(now - i*604800000).yyyymm()).reverse();
  return weeks.map(function(weekval){
    var out = {
      year : weekval.split('-')[0],
      week : parseInt(weekval.split('-')[1])
    };
    var rec = updates.find(x => x.week == weekval);
    if(rec){
      out.total = rec.total;
      out.packages = sort_packages(objectToArray(rec.packages || [])).map(x => x.package);
    }
    return out;
  });
}

function make_activity_chart(universe){
  return get_ndjson(`https://${universe && universe + "." || ""}r-universe.dev/stats/updates?all=true`).then(function(updates){
    const data = activity_data(updates);
    const ctx = document.getElementById('activity-canvas');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(x => x.week),
        datasets: [{
          label: 'updates',
          data: data.map(x => x.total),
          backgroundColor: 'rgb(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins : {
          legend: false,
          title: {
            display: false,
            text: "Weekly package updates in " + universe
          },
          tooltip: {
            animation: false,
            callbacks: {
              title: function(items){
                const item = items[0];
                const weekdata = data[item.dataIndex];
                return weekdata.year + ' week ' + weekdata.week;
              },
              label: function(item) {
                let packages = data[item.dataIndex].packages;
                let len = packages.length;
                if(len > 5){
                  return ` Updates in ${packages.slice(0,4).join(', ')} and ${packages.length-4} other packages`;
                } else if(len > 1) {
                  return ` Updates in ${packages.slice(0,len-1).join(', ')} and ${packages[len-1]}`;
                } else {
                  return ` Updates in ${packages[0]}`;
                }
              }
            }
          }
        },
        layout: {
          padding: 20
        }
      }
    });
  });
}

function get_user_data(user, max){
  const p1 = get_ndjson(`https://${user}.r-universe.dev/stats/contributors?all=true&limit=${max}`);
  const p2 = get_ndjson(`https://${user}.r-universe.dev/stats/contributions?limit=100&skipself=1&cutoff=0`);
  return Promise.all([p1, p2]).then(function(results){
    return results;
  });
}

function combine_results(results){
  const contributions = results[1];
  if(contributions.length == 0){
    return results[0];
  }
  var data = results[0].map(function(x){
    x.contributions = 0;
    x.packages = [];
    return x;
  });
  contributions.forEach(function(x, i){
    x.maintainers.forEach(function(maintainer){
      var rec = data.find(y => y.login == maintainer);
      if(!rec){
        rec = {login: maintainer, total: 0, contributions: 0, repos: [], packages: []};
        data.push(rec);
      }
      rec.contributions = rec.contributions + x.contributions;
      rec.packages = rec.packages.concat(x.packages);
    });
  });
  return data.sort(function(x,y){return (x.total + x.contributions > y.total + y.contributions) ? -1 : 1}).slice(0,30);
}

function make_contributor_chart(universe, max, imsize){
  max = max || 100;
  return get_user_data(universe, max).then(function(results){
    const contributors = combine_results(results).filter(x => x.login != universe);
    const size = imsize || 50;
    const logins = contributors.map(x => x.login);
    const totals = contributors.map(x => x.total);
    const contribs = contributors.map(x => -1* x.contributions);
    const contribpkgs = contributors.map(x => x.packages);
    const mypkgs = contributors.map(x => sort_packages(x.repos).map(x => x.upstream.split(/[\\/]/).pop()));
    const avatars = logins.map(x => `https://r-universe.dev/avatars/${x.replace('[bot]', '')}.png?size=${size}`);
    const images = avatars.map(x => undefined);
    const promises = avatars.map(download_avatar);

    function download_avatar(url, index){
      var img = new Image();
      img.src = url;
      return img.decode().then(function(x){
        images[index] = img;
      }).catch(function(e){
        console.log("Failed to load image: " + url);
      });
    }

    function render_avatars(){
      var xAxis = myChart.scales.x;
      var yAxis = myChart.scales.y;
      yAxis.ticks.forEach((value, index) => {
        var y = yAxis.getPixelForTick(index);
        var img = images[index];
        if(!img) return;
        myChart.ctx.drawImage(img, xAxis.left - size - 105, y - size/2, size, size);
      });
    }

    const ctx = document.getElementById('contributors-canvas');
    $(ctx).height(logins.length * (size + 10) + 50);
    ctx.onclick = function(e){
      const pts = myChart.getElementsAtEventForMode(e, 'nearest', {intersect: true}, true);
      if(pts.length){
        const x = pts[0];
        const user = logins[x.index];
        window.location.href = `https://${user}.r-universe.dev/ui#contributors`;
      }
    };

    /* NB: to disable animation alltogether (for performance) we need to set
       options.animation: false, and uncomment the afterDraw handler */

    const myChart = new Chart(ctx, {
      type: 'bar',
      plugins: [{
//        afterDraw: render_avatars
      }],
      data: {
        labels: logins,
        datasets: [{
          label: 'incoming',
          data: totals,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderSkipped: false,
          borderRadius: 5,
          //minBarLength: 10
        },{
          label: 'outgoing',
          data: contribs,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderSkipped: false,
          borderRadius: 5,
          //minBarLength: 10
        }]
      },
      options: {
        //events: [], //disable all hover events, much faster (but no tooltips)
        animation : {
          onComplete: render_avatars,
          onProgress: render_avatars
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins : {
          legend: false,
          title: {
            display: false,
            text: `Contributions by/to ${universe}`
          },
          tooltip: {
            animation: false,
            callbacks: {
              title:function(item){
                const label = item[0].label;
                return item[0].datasetIndex ? `${universe} to ${label}` : `${label} to ${universe}`;
              },
              label: function(item) {
                let packages = item.datasetIndex ? contribpkgs[item.dataIndex] : mypkgs[item.dataIndex];
                let len = packages.length;
                if(len > 5){
                  return ` Contributed to ${packages.slice(0,4).join(', ')} and ${packages.length-4} other projects`;
                } else if(len > 1) {
                  return ` Contributed to ${packages.slice(0,len-1).join(', ')} and ${packages[len-1]}`;
                } else {
                  return ` Contributed to ${packages[0]}`;
                }
              }
            }
          }
        },
        layout: {
          padding: {
            left: 70
          }
        },
        scales: {
          y: {
            stacked: true,
            ticks: {
              //padding: 60,
              beginAtZero: true,
              callback: function(value, index, ticks){
                return logins[value].padStart(20);
              }
            }
          },
          x: {
            stacked: true,
            ticks: {
              //maxRotation: 90,
              //minRotation: 90,
              display: true,
              callback: Math.abs
            }
          },
        }
      }
    });
    // in case images were still downloading when chart was rendered
    Promise.all(promises).then(() => render_avatars());
  });
}

function tag_annotations(tags, activity_data){
  return tags.sort((a, b) => (a.date > b.date) ? 1 : -1).map(function(x, i){
    var date = new Date(x.date);
    var week = date.getWeek();
    var year = date.getWeekYear();
    var bin = activity_data.findIndex(x => x.week == week && x.year == year);
    var latest = (i == tags.length-1);
    var color = latest ? '#dc3545' : 'black';
    return {
      type: 'line',
      xMin: bin,
      xMax: bin,
      borderColor: color,
      borderDash: [20, 5],
      arrowHeads: { start: {
        borderDash: [1,0],
        enabled: true,
        fill: true,
        width: 5,
        length: 5
      }},
      label: {
        backgroundColor: 'rgb(0,0,0,0)',
        color: 'rgb(0,0,0,0)',
        enabled: true,
        content: `${latest ? 'Latest tag' : 'Tag'}: ${x.name} (${x.date})`,
        position: 'start',
        yAdjust: -25
      }
    }
  });
}

function detail_update_chart(package, gitstats){
  const ctx = $('#package-updates-canvas').empty().attr('height', '300').height(300);
  const data = activity_data(gitstats.updates.map(x => ({total:x.n, week:x.week})));
  const tags = tag_annotations(gitstats.tags || [], data);
  const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(x => x.week),
      datasets: [{
        label: 'updates',
        data: data.map(x => x.total),
        backgroundColor: 'rgb(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins : {
        legend: false,
        title: {
          display: false,
        },
        tooltip: {
          animation: false,
          callbacks: {
            title: function(items){
              const item = items[0];
              const weekdata = data[item.dataIndex];
              return weekdata.year + ' week ' + weekdata.week;
            }
          }
        },
        annotation: {
          annotations: tags,
          enter({chart, element}, event) {
            element.options.label.backgroundColor = element.options.borderColor;
            element.options.label.color = 'white'
            chart.draw();
          },
          leave({chart, element}, event) {
            element.options.label.backgroundColor = 'transparent'
            element.options.label.color = 'transparent'
            chart.draw();
          }
        }
      },
      layout: {
        padding: 20
      },
      scales: {
        y : {
          title: {
            display: true,
            text: 'Weekly updates'
          }
        }
      }
    }
  });
}

function normalize_authors(str){
  // nested parentheses due to parenthesis inside the comment
  return str.replace(/\s*\([^()]*\)/g, '').replace(/\s*\([\s\S]+?\)/g,"");
}

function guess_tracker_url(src){
  if(src.BugReports){
    return src.BugReports;
  }
  var upstream = src._builder.upstream.replace('https://github.com/r-forge/', 'https://r-forge.r-project.org/projects/')
  if(upstream.match("github.com")){
    return upstream + '/issues';
  }
  return upstream;
}

function populate_download_links(x, details){
  var src = x.find(x => x._type == 'src');
  var wins = x.filter(x => x._type == 'win');
  var macs = x.filter(x => x._type == 'mac');
  var srcfile = `${src.Package}_${src.Version}.tar.gz`;
  details.find('.package-details-source').attr('href', `${server}/src/contrib/${srcfile}`).text(srcfile).addClass("text-primary");
  wins.forEach(function(pkg){
    var build = pkg.Built.R.substring(0,3);
    var filename = `${pkg.Package}_${pkg.Version}.zip`;
    var winlinks = details.find('.package-details-windows');
    $("<a>").text(filename).attr('href', `${server}/bin/windows/contrib/${build}/${filename}`).appendTo(winlinks);
    winlinks.append(` (r-${build}) `)
  });
  macs.forEach(function(pkg){
    var build = pkg.Built.R.substring(0,3);
    var filename = `${pkg.Package}_${pkg.Version}.tgz`;
    var maclinks = details.find('.package-details-macos');
    $("<a>").text(filename).attr('href', `${server}/bin/macosx/contrib/${build}/${filename}`).appendTo(maclinks);
    maclinks.append(` (r-${build}) `)
  });
  details.find(".package-details-logs").attr('href', src._builder.url);
}

function link_to_pkg(owner, pkg){
  if(owner === user)
    return `#package:${pkg}`;
  return `https://${owner}.r-universe.dev/ui#package:${pkg}`
}

function populate_revdeps(package){
  var revdepdiv = $(".package-details-revdeps").empty();
  get_json(`https://r-universe.dev/stats/usedby?package=${package}`).then(function(revdeps){
    $('.package-details-revdeps-header').text(package + ' usage');
    function add_link(dep){
      $("<a>").text(dep.package)
      .attr('href', link_to_pkg(dep.owner, dep.package))
      .click(function(e){
        if(dep.owner == user){
          tab_to_package(pkg.Package);
        }
      })
      .appendTo(revdepdiv);
      revdepdiv.append(" ");
    }
    if(revdeps.hard.length){
      revdepdiv.append($("<b>").text("Hard reverse dependencies: "))
      revdeps.hard.forEach(add_link);
      revdepdiv.append("<br>");
    }
    if(revdeps.soft.length){
      revdepdiv.append($("<b>").text("Soft reverse dependencies: "))
      revdeps.soft.forEach(add_link);
    }
    if(!revdeps.hard.length && !revdeps.soft.length){
      revdepdiv.append($("<i>").text(`No packages in r-universe depending on '${package}' yet.`))
    }
  });
}

function populate_package_details(package){
  if(window.detailpkg == package) return;
  window.detailpkg = package;
  const old = Chart.getChart('package-updates-canvas');
  if(old) old.destroy();
  $('#package-details-spinner').show();
  $('.package-details-container .details-card').remove();
  $('.package-details-contributors').empty();
  $(".package-details-gist-name").text(package);
  var details = $('#templatezone .details-card').clone();
  populate_revdeps(package);
  get_path(`${server}/packages/${package}/any`).then(function(x){
    $('#package-details-spinner').hide();
    details.prependTo('.package-details-container');
    var fail = x.find(x => x._type == 'failure');
    if(fail){
      details.find('.build-failure-alert').removeClass('d-none');
      details.find('.build-failure-url').attr('href', fail._builder.url);
    }
    var src = x.find(x => x._type == 'src') || alert("Failed to find package " + package);
    var builder = src['_builder'] || {};
    details.find('.package-details-header').text(`${src._owner}/${src.Package} ${src.Version}`);
    details.find('.package-details-name').text(`${src.Package}`)
    details.find('.package-details-title').text(src.Title);
    details.find('.package-details-description').text(src.Description);
    details.find('.package-details-author').text(normalize_authors(src.Author));
    details.find('.citation-link').attr('href', `${server}/citation/${package}.cff`);
    details.find('.package-json-link').attr('href', `${server}/packages/${package}`);
    details.find('.upstream-git-link').attr('href', builder.upstream);
    populate_download_links(x, details);
    attach_cran_badge(src._user, src.Package, builder.upstream, details.find('.cranbadge'));
    var issuetracker = guess_tracker_url(src);
    details.find(".package-details-issues").text(issuetracker).attr('href', issuetracker);
    details.find('.package-details-topics').empty().append(make_topic_labels(builder));
    if(src._published > "2022-04-11T11:00:00.000Z"){
      details.find('.package-details-manual').text(`${src.Package}.pdf`).attr('href', `${server}/manual/${package}.pdf`);
    } else {
      details.find('.fa-file-pdf').hide()
      //remove when all pkgs have been built
    }
    if(builder.commit.time){
      details.find('.package-details-updated').text('Last updated ' + pretty_time_diff(builder.commit.time));
    }
    if(builder.pkglogo){
      details.find('.package-details-logo').attr('src', builder.pkglogo).removeClass('d-none');
    }
    var maintainer = builder.maintainer || {};
    details.find('.package-details-maintainer .maintainer-name').text(maintainer.name);
    if(maintainer.login !== user){
      details.find('.package-details-maintainer').removeClass('d-none');
    }
    if(maintainer.login){
      details.find('.package-details-maintainer a').attr('href', `https://${maintainer.login}.r-universe.dev`);
      details.find('.package-details-maintainer img').attr('src', `https://r-universe.dev/avatars/${maintainer.login}.png?size=140`);
    }
    if(builder.vignettes){
      var articles = details.find('.package-details-article-list');
      builder.vignettes.forEach(function(x){
        var minilink = `${src.Package}/${x.filename}`;
        var item = $("#templatezone .package-details-article").clone();
        item.attr('href', `https://${src._user}.r-universe.dev/articles/${minilink}`);
        if(minilink.endsWith('html')){
          item.click(function(e){
            e.preventDefault();
            navigate_iframe(minilink);
            $("#view-tab-link").tab('show');
            window.scrollTo(0,0);
          });
        }
        item.find('.detail-article-source').text(x.source);
        item.find('.detail-article-engine').text(x.engine);
        item.find('.detail-article-build').text(src._published.substring(0, 19).replace("T", " "));
        item.find('.article-modified').text('Last update: ' + (x.modified || "??").substring(0, 10));
        item.find('.article-created').text('Started: ' + (x.created || "??").substring(0, 10));
        item.find('.package-details-article-author').text(x.author);
        item.find('.article-title').text(x.title);
        item.appendTo(articles);
      });
    }
    if(builder.status == 'failure'){
      details.find('.vignette-failure-url').attr('href', builder.url);
      details.find('.vignette-failure-alert').removeClass('d-none');
    }
    if(builder.gitstats && builder.gitstats.updates){
      detail_update_chart(package, builder.gitstats);
    }
    if(builder.gitstats && builder.gitstats.contributions){
      var names = Object.keys(builder.gitstats.contributions);
      names.forEach(function(login){
        var count = builder.gitstats.contributions[login];
        var item = $("#templatezone .package-details-contributor").clone();
        item.attr('href', `https://${login}.r-universe.dev/ui#contributors`);
        item.find("img").attr('src', `https://r-universe.dev/avatars/${login}.png?size=160`)
            .tooltip({title: `${login} made ${count} contributions to ${package}`});
        item.appendTo('.package-details-contributors');
      });
    }
  });
}

function tab_to_package(package){
  populate_package_details(package);
  $("#package-tab-link").tab('show');
  window.scrollTo(0,0);
}

//INIT
var devtest = 'jeroen'
var host = location.hostname;
var user = host.endsWith("r-universe.dev") ? host.split(".")[0] : devtest;
var server = host.endsWith("r-universe.dev") ? "" : 'https://' + user + '.r-universe.dev';
init_github_info(user, server).then(function(){
  init_maintainer_list(user, server);
  if(!window.location.hash){
    $('#packages-tab-link').click();
  }
});
init_package_descriptions(server, user);


var articledatapromise = init_article_data(server);
iFrameResize({ log: false, checkOrigin: false }, '#viewerframe');
$('#articles-tab-link').one('shown.bs.tab', function (e) {
  articledatapromise.then(data => init_article_list(data, user));
});

$('#builds-tab-link').one('shown.bs.tab', function (e) {
  init_packages_table(server, user);
  make_activity_chart(user);
});
$('#contributors-tab-link').one('shown.bs.tab', function (e) {
  make_contributor_chart(user, 30);
});
$('a[data-toggle="tab"]').historyTabs();
