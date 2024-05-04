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

function countstr(count){
  return count < 1000 ? count : (count/1000).toFixed(1) + 'k';
}

/* Menu example: https://www.codeply.com/p/eDmT9PMWW3 */
$(function(){
  function SidebarCollapse() {
    $('.menu-collapsed').toggleClass('d-none');
    $('#sidebar-container').toggleClass('sidebar-expanded sidebar-collapsed');
    $('.sidebar-separator-title').toggleClass('d-flex');
  }
  $("#sidebar-container").mouseenter(SidebarCollapse);
  $("#sidebar-container").one('mouseenter', function(){
    $("#sidebar-container").mouseleave(SidebarCollapse);
  });
});

/* Experiment with fixed-width */
$(function(){
  addEventListener("keydown", function(e){
    if(e.key == 'w'){
      let size = prompt("Please enter max-width in pixels", "1200");
      $("#content-container").removeClass('container-flex').addClass('container').css('max-width', size+"px");
    }
  });
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
  return pkg._pkgdocs && pkg._pkgdocs.match(/succ/i);
}

function docs_icon(x){
  if(x._pkgdocs){
    var i = $("<i>", {class : 'fa fa-book'});
    var a = $("<a>").attr('href', x._buildurl).append(i).css('margin-left', '5px');
    if(!x._registered){
      /* This is a 'remote' package */
      return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', color_meh);
    }
    if(docs_ok(x)){
      i.css('color', color_ok);
      a.attr('href', 'https://docs.ropensci.org/' + x.Package).attr("target", "_blank");
    } else {
      i.css('color', color_bad);
    }
    return $('<span></span>').append(a);
  }
}

function run_icon(bin, desc){
  if(bin.skip || bin.status === 'skipped')
    return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', 'slategrey');
  if(bin.type == 'pending')
    return $('<span></span>');
  var iconmap = {
    wasm: "chrome",
    src : "linux",
    win : "windows",
    mac : "apple"
  };
  var buildurl = bin._buildurl || desc._buildurl;
  var type = bin.os || 'src';
  var status = bin.status || bin._status || "none";
  if(status === 'none'){
    var i = $("<i>", {class : 'fa fa-times'}).css('margin-left', '5px').css('color', '#cb2431');
    var a = $("<a>").attr('href', buildurl).append(i);
  } else {
    var i = $("<i>", {class : 'fab fa-' + iconmap[type]});
    var a = $("<a>").attr('href', buildurl).append(i).css('margin-left', '5px');
    // can be "success" or "Succeeded"
    if(status.match(/succ/i)){
      i.css('color', '#22863a');
    } else if(status === 'arm64-failure'){
      i.css('color', '#cb2431');
    } else if(type == 'src'){
      i.css('color', '#cb2431');
    } else if(type == 'wasm'){
      i.css('color', '#e0e0e0');
    } else {
      i.css('color', 'slategrey');
    }
  }
  //return $('<span></span>').append(a);
  return a.tooltip({title: `${type} build: ${status}`});
}

function is_success(x){
  var status = x.status || x._status || "";
  return status.match(/(succ|pending|skipped)/i) || x.skip;
}

function all_ok(builds){
  var src = builds[0];
  if(user == 'ropensci'){
    if(src._registered  && !docs_ok(src)){
      return false;
    }
  }
  return builds.every(is_success) && !src._failure;
}

function make_sysdeps(desc){
  var sysdeps = desc._sysdeps || [];
  if(sysdeps.length){
    var div = $("<div>").css("max-width", "33vw");
    var unique = {};
    sysdeps.forEach(x => unique[x.name] = x);
    Object.keys(unique).sort().forEach(function(key){
      var x = unique[key];
      //var url = 'https://packages.ubuntu.com/' + distro + '/' + (x.headers || x.package);
      var url = `https://r-universe.dev/search/?q=${key}`
      $("<a>").text(key).attr("href", url).appendTo(div);
      version = x.version.replace(/[0-9.]+:/, '').replace(/[+-].*/, '').replace(/\.[a-z]+$/, '');
      div.append(" (" + version + ")\t");
    });
    return div.addClass('d-none d-xl-inline'); //todo: set d-xl-table-cell on the parent td element instead
  }
}

Date.prototype.yyyymmdd = function() {
  if(!isNaN(this.getTime())){
    var yyyy = this.getFullYear();
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    return $("<span>").text([yyyy, (mm>9 ? '' : '0') + mm, (dd>9 ? '' : '0') + dd].join('-')).addClass('text-nowrap')
  } else {
    return "";
  }
};

var crandata = {};
function get_cran_status(package){
  crandata[package] = crandata[package] || get_json(`${server}/shared/cranstatus/${package}`);
  return crandata[package];
}

function attach_cran_badge(package, url, el, cranicon){
  get_cran_status(package).then(function(craninfo){
    if(!craninfo.version){
      return; //not a CRAN package
    }
    if(craninfo.version === 'archived'){
      var color = color_meh;
      var iconclass = "fa fa-exclamation-circle";
      var tiptext = `Package ${package} was archived on CRAN!`;
    } else if(compare_url(url, craninfo.urls || craninfo.url || "")){
      var color = color_ok;
      var iconclass = cranicon || "fa fa-award";
      var tiptext = "Verified CRAN package!";
    } else {
      var iconclass = "fa fa-question-circle popover-dismiss";
      var color = color_bad;
      if (url.match('https://github.com/cran/')){
        var tiptext = `A package '${package}' exists on CRAN but description does not link to any git repository or issue tracker`;
      } else {
        var tiptext = `A package '${package}' exists on CRAN but description does not link to:<br/><u>${url}</u>. This could be another source.`;
      }
      var color = color_bad;
    }
    var icon = $("<i>").addClass(iconclass).css('color', color);
    var cranlink = $("<a>").attr("href", "https://cran.r-project.org/package=" + package).
      attr("target", "_blank").css("margin-left", "5px").css("margin-right", "10px").append(icon);
    el.after(cranlink);
    if(url.substring(0,27) == 'https://github.com/r-forge/'){
      url = 'https://r-forge.r-project.org';
    }
    cranlink.tooltip({title: tiptext, html: true});
  }).catch((error) => {
    console.log('Failed to load attach CRAN badge:', error);
  });
}

function compare_url(giturl, cran){
  if(giturl.includes("r-forge")) {
    return true; //don't validate git-svn r-forge urls
  }
  var str = giturl.trim().toLowerCase().replace("https://", "");
  return cran.join().toLowerCase().includes(str);
}

function nowrap_span(x){
  return $("<span></span>").addClass('text-nowrap').append(x);
}

function add_table_row(x, user){
  var org = x._user;
  var package = x.Package
  var version = x.Version || "-";
  var owner = x._owner;
  var commit = x._commit || {};
  var id = commit.id;
  var maintainer = x._maintainer;
  var upstream = x._upstream;
  var binaries = x._binaries || [];
  var win = binaries.find(bin => bin.os == 'win' && bin.r.substring(0,3) == '4.4' && bin.commit == id) || {os: 'win', skip: x.OS_type === 'unix', status: x._winbinary}; //{type:'pending'};
  var mac = binaries.find(bin => bin.os == 'mac' && bin.r.substring(0,3) == '4.4' && bin.commit == id && bin.arch != 'x86_64') || {os: 'mac', skip: x.OS_type === 'windows', status: x._macbinary}; //{type:'pending'};
  var wasm = binaries.find(bin => bin.os == 'wasm' && bin.r.substring(0,3) == '4.3' && bin.commit == id) || {os: 'wasm', skip: x.OS_type === 'windows', status: 'failure'};
  //var oldwin = binaries.find(bin => bin.os == 'win' && bin.r.substring(0,3) == '4.3' && bin.commit == id) || {os: 'win', skip: x.OS_type === 'unix'};
  //var oldmac = binaries.find(bin => bin.os == 'mac' && bin.r.substring(0,3) == '4.3' && bin.commit == id && bin.arch != 'x86_64') || {os: 'mac', skip: x.OS_type === 'windows'};
  var builddate = $("<span>").addClass("d-none d-xl-inline").append(new Date(x._created || NaN).yyyymmdd());
  var commiturl = `${upstream}/commit/${commit.id}`;
  var versionlink = $("<a>").text(version).attr("href", commiturl).attr("target", "_blank").addClass('text-dark');
  var commitdate = new Date(commit.time * 1000 || NaN).yyyymmdd();
  var sysdeps = make_sysdeps(x);
  var longname = (owner == user || owner == 'cran' || upstream.match('git.bioconductor')) ? package : `${owner}/${package}`;
  var pkglink = $("<a>").text(longname);
  if(x._type == 'failure'){
    pkglink.attr('disabled', 'disabled').css('text-decoration', 'line-through');
  } else {
    pkglink.attr("href", link_to_pkg(org, package)).click(function(e){
      if(org == user){
        e.preventDefault();
        tab_to_package(package);
      }
    });
  }
  //in case of failed/lagging binaries, use the latest known status
  //if(x._commit.id != win.commit) win.status = x._winbinary;
  //if(x._commit.id != mac.comit) mac.status = x._macbinary;

  if(x._registered === false){
    pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(via remote)"));
  }
  if(x.OS_type){
    pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(" + x.OS_type + " only)"));
  }
  var docslink = (user == 'ropensci') ? docs_icon(x) : "";
  if(!all_ok([x,win,mac,wasm])){
    var retrytype = x._failure ? 'failure' : 'src';
    var retryversion = x._failure ? x._failure.version : version;
    var rebuildlink = $("<a>").attr("href", x._buildurl).addClass('fa fa-sync-alt d-none d-xl-inline').click(function(e){
      e.preventDefault();
      rebuildlink.attr("disabled", true).off('click');
      var req = $.ajax({
        type: 'PATCH',
        url: `https://${org}.r-universe.dev/packages/${package}/${retryversion}/${retrytype}`
      }).done(function() {
        alert(`Success! Retrying failed build for ${package} ${retryversion}`)
        window.location = x._buildurl;;
      }).fail((jqXHR, textStatus) => {
        alert(jqXHR.responseText)
        if(jqXHR.status == 429) window.location = src._buildurl;
      }).always(xhr => rebuildlink.tooltip('dispose'));
    });
    rebuildlink.tooltip({title: `Retry failed builds for ${package} ${retryversion}`});
  }
  var maintainerlink = maintainer.login ? $("<a>").attr("href", "https://" + maintainer.login + ".r-universe.dev") :  $("<span>")
  maintainerlink.text(maintainer.name).addClass('text-secondary');
  var binaries = nowrap_span([run_icon(win, x), run_icon(mac, x), run_icon(wasm, x)]);
  var row = tr([commitdate, pkglink, versionlink, maintainerlink, docslink, run_icon(x, x),
    binaries, /*(user == 'bioconductor' || user == 'cran') ? null : [run_icon(oldwin, x), run_icon(oldmac, x)], */ rebuildlink, builddate, sysdeps]);
  if(x._failure){
    pkglink.after($("<a>").attr("href", x._failure.buildurl).append($("<small>").addClass('pl-1 font-weight-bold').text("(build failure)").css('color', 'red')));
  } else if(user != 'bioconductor' && user != 'bioc' && user != 'cran' && owner != 'cran') {
    attach_cran_badge(package, upstream, pkglink);
  }
  row.appendTo("#packages-table-body");
}

function update_registry_status(ghuser, server){
  const tooltip_success = "Universe registry is up to date";
  const tooltip_failure = "There was a problem updating the registry. Please inspect the log files.";
  const apipath = '/repos/r-universe/' + ghuser + '/actions/workflows/sync.yml/runs?per_page=1&status=completed';
  $("#registry-status-link").attr("href", 'https://github.com/r-universe/' + ghuser + '/actions/workflows/sync.yml');
  return github_api(apipath).then(function(data){
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

function bitbucket_api_info(ghuser, server){
  //bitbucket has no public api?
  $("#github-user-name").text(`${ghuser.substring(10)} (bitbucket)`);
  $("#github-user-avatar").attr('src', 'https://r-universe.dev/avatars/atlassian.png?size=400');
}

function gitlab_api_info(ghuser, server){
  var username = ghuser.substring(7);
  return get_json(`https://gitlab.com/api/v4/users?username=${username}`).then(function(res){
    if(res && res[0]){
      return res[0];
    }
    return get_json(`https://gitlab.com/api/v4/groups/${username}`)
  }).then(function(user){
    user = user || {};
    $("#github-user-name").text(user.name || ghuser);
    $("#github-user-avatar").attr('src', user.avatar_url && user.avatar_url.replace(/s=[0-9]+/, 's=400'));
  });
}

function github_api(path){
  return get_json('https://api.github.com' + path).catch(function(err){
    console.log("Failed to contact api.github.com. Trying proxy...")
    return get_json(server + '/gh' + path);
  });
}

function github_user_info(ghuser, server){
  if(ghuser == 'bioc'){
    ghuser = 'bioconductor' //bioc is the mirror or for bioconductor
  }
  $("#github-user-avatar").attr('src', 'https://r-universe.dev/avatars/' + ghuser + '.png');
  $("#rss-feed").attr("href", server + '/feed.xml');
  jQuery.get(`https://r-universe.dev/avatars/${user}.keys`).done(function(res){
    if(res.length){
      $("#github-user-keys").toggleClass("d-none").attr('href', `https://github.com/${user}.keys`);
    }
  });
  return github_api('/users/' + ghuser).then(function(user){
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
      $("#github-user-followers").toggleClass("d-none").find('.content').text(countstr(user.followers) + " followers");
    }
    if(user.type == 'User'){
      $("#github-user-avatar").addClass("rounded-circle");
    } else {
      $("#github-user-avatar").removeClass("rounded-circle");
      //$("#github-user-avatar").addClass("p-2");
    }
  }).catch(function(err){
    $("#github-user-bio").text(err);
  });
}

function init_user_info(ghuser, server){
  $("head title").text("R-universe: " + ghuser);
  $(".title-universe-name").text(ghuser);
  $(".title-universe-name-clean").text(ghuser.replace(/\W/g, ''));
  var p1 = update_registry_status(ghuser, server).catch(alert);
  var p2 = init_user_summary(server);
  if(ghuser.startsWith('bitbucket-')){
    bitbucket_api_info(ghuser, server);
    return p1;
  } else if(ghuser.startsWith('gitlab-')){
    return gitlab_api_info(ghuser, server);
  } else {
    return github_user_info(ghuser, server);
  }
}

function init_user_summary(server){
  return get_json(`${server}/stats/summary?all=true`).then(function(stats){
    $("#github-user-packages .content").text(stats.packages + ' packages').click(function(e){
      e.preventDefault();
      $("#packages-tab-link").click();
    });
    $("#github-user-articles .content").text(stats.articles + ' articles').click(function(e){
      e.preventDefault();
      $("#articles-tab-link").click();
    });
    $("#github-user-datasets .content").text(stats.datasets + ' datasets').click(function(e){
      e.preventDefault();
      $("#api-tab-link").click();
    });
    $("#github-user-contributors .content").text(stats.contributors + ' contributors').click(function(e){
      e.preventDefault();
      $("#contributors-tab-link").click();
    });
  })
}

function add_maintainer_icon(maintainer){
  var item = $("#templatezone .maintainer-item").clone();
  item.find('.maintainer-name').text(maintainer.name)
  if(maintainer.login){
    item.find('.maintainer-link').attr('href', 'https://' + maintainer.login + '.r-universe.dev');
    item.find('.maintainer-avatar').attr('src', avatar_url(maintainer.login, 140));
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
    x.sort(order).slice(0,25).forEach(function(maintainer){
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
    //hide panel if no links
    $(".maintainer-list-panel").toggle($('#maintainer-list').children().length > 0);
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

function get_package_image(pkg){
  var owner = pkg['_owner'];
  var pkglogo = pkg._pkglogo;
  if(pkglogo && pkglogo.startsWith('http'))
    return pkglogo;
  var maintainerdata = pkg._maintainer || {};
  var maintainer = maintainerdata.login;
  if(maintainer && maintainer != user){
    return avatar_url(maintainer, 140);
  }
  if(owner && owner != user){
    return avatar_url(owner, 140);
  }
  return avatar_url('r-universe', 140);
}

//temp duplicate because of api overhaul
function make_topic_badges(src){
  var topics = src._topics || [];
  if(src._sysdeps){
    src._sysdeps.forEach(function(x){
      if(x.name && Array.isArray(topics) && !topics.includes(x.name)){
        topics.push(x.name)
      }
    });
  }
  return make_badges(topics);
}


function get_topic_page(index, topic){
  if(!topic || !index || !index.length) return;
  return index.find(function(x) {return Array.isArray(x.topics) && x.topics.includes(topic)});
}

function help_page_url(package, index, topic){
  var chapter = get_topic_page(index, topic);
  if(chapter && chapter.page){
    return `${server}/${package}/doc/manual.html#${chapter.page.replace(/.html$/, "")}`;
  }
}

function make_exports_badges(src){
  var div = $("<span>");
  var package = src.Package;
  var labels = src._exports || [];
  var index = src._help || [];
  labels.forEach(function(topic){
    var url = help_page_url(package, index, topic);
    $("<a>").attr("target", "_blank").attr("href", url).addClass(`badge badge-secondary mr-1`).text(topic).appendTo(div);
  });
  return div;
}

function make_badges(labels, color, prefix){
  var color = color || "info";
  var prefix = prefix || "";
  var skiptopics = ['r', 'rstats', 'package', 'cran', 'r-stats', 'r-package'];
  var div = $("<span>");
  if(labels && labels.length){
    labels.filter(x => skiptopics.indexOf(x) < 0).forEach(function(topic){
      var quotedtopic = topic.includes("-") ? `"${topic}"` : encodeURIComponent(topic);
      var topicurl = `https://r-universe.dev/search?q=${prefix}${quotedtopic}`;
      $("<a>").attr("href", topicurl).addClass(`badge badge-${color} mr-1`).text(topic).appendTo(div);
    });
  }
  return div;
}

function make_help_table(src){
  var package = src.Package;
  var tbody = $('.manpages-table tbody').empty();
  var help = src._help || [];
  help.forEach(function(page){
    var name = page.page.replace(/\.html$/, "");
    var link = a(`${server}/${package}/doc/manual.html#${name}`, page.title || name).attr("target", "_blank");
    tr([link, Array.isArray(page.topics) && page.topics.join(" ")]).appendTo(tbody);
  });
}

function add_package_card(x, i, user){
  if(x._type == 'failure') return;
  var org = x._user;
  var item = $("#templatezone .package-description-item").clone();
  var login = x._maintainer.login;
  if(login) {
    item.find('.package-maintainer').attr('href', `https://${login}.r-universe.dev`);
  }
  item.find('.package-name').text(x.Package)
  item.find('.package-link').attr("href", link_to_pkg(org, x.Package)).click(function(e){
    if(org == user){
      e.preventDefault();
      tab_to_package(x.Package);
    }
  });
  item.find('.package-maintainer').text(x._maintainer.name);
  item.find('.package-title').text(x.Title);
  item.find('.package-description').text(x.Description.replace('\n', ' '));
  item.find('.description-last-updated').text('Last updated ' + pretty_time_diff(x._commit.time));
  if(x._stars){
    item.find('.description-github-stars').removeClass("d-none").append(` ${countstr(x._stars)} stars`)
  }
  if(x._rundeps){
    item.find('.description-dependencies').removeClass('d-none').append(` ${x._rundeps.length} dependencies`);
  }
  if(x._usedby){
    item.find('.description-dependents').removeClass('d-none').append(` ${x._usedby} dependents`);
  }
  item.find('.description-pkgscore').removeClass('d-none').append(` ${Math.pow(x._score-1, 2).toFixed(2)} score`);
  item.find('.package-image').attr('src', get_package_image(x));
  item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
  if(org != user){
    item.find('.package-org').toggleClass("d-none").append(a(`https://${org}.r-universe.dev`, org));
  }
  item.find('.description-topics').append(make_topic_badges(x));
}

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
    if(name == ":registry") {
      var link_url = `https://github.com/r-universe/${org}/actions/workflows/sync.yml`;
    } else {
      var link_url = `https://${org}.r-universe.dev/${name[0] == ":" ? "" : name}`;
    }
    const text = `[![${name} status badge](${badge_url})](${link_url})`;
    navigator.clipboard.writeText(text).then(function(e){
      md_icon.attr('data-original-title', 'Copied!').tooltip('show');
      md_icon.attr('data-original-title', tooltip_text);
    });
  });
  $("<td>").append(md_icon).appendTo(tr);
}

function init_package_descriptions(server, user){
  //get_ndjson(server + '/stats/descriptions?all=true').then(function(x){
  var first_page = true;
  var fields = ['Package', 'Version', 'OS_type', '_user', '_owner', '_commit', '_maintainer', '_upstream', '_binaries', '_sysdeps',
    '_created', '_winbinary', '_macbinary', '_status', '_buildurl', '_failure', '_type', '_registered', '_pkgdocs',
    'Title', 'Description', '_rundeps', '_stars', '_score', '_topics', '_pkglogo'];
  var total = 0;
  ndjson_batch_stream(server + `/api/packages?limit=2500&all=true&stream=true&fields=${fields.join()}`, function(batch){
    if(first_page && batch.find(pkg => pkg['_user'] == user)){
      add_badge_row(":name", user);
      add_badge_row(":registry", user);
      add_badge_row(":total", user);
      first_page = false;
    }
    batch.forEach(x => add_table_row(x, user));
    batch = batch.filter(x => x._registered);
    total = total + batch.length;
    if(total < 350){ //ropensci is 350
      batch.forEach((x,i) => add_package_card(x, i, user));
    }
    batch.forEach(x => add_badge_row(x.Package, x._user));
    $("#package-description-placeholder").hide();
    $("#package-builds-placeholder").hide()
  }).then(function(count){
    if(count > 0) lazyload(); //for badges
    $("#package-builds-placeholder").text(`No packages found for: ${user}`);
    $("#package-description-placeholder").text(`No packages found for: ${user}`);
  });
}

function display_article(minilink){
  if(window.iframestate !== minilink){
    window.iframestate = minilink;
    console.log('Navigating iframe to: ' + minilink);
    var pkg = minilink.split("/")[0];
    var file = minilink.split("/")[1];
    frames['viewerframe'].location.replace(server + "/" + pkg + '/doc/' + file);
    update_article_info();
    if(minilink){
      document.getElementById('viewerframe').onload=function(){$('#article-placeholder').hide()};
      $('#article-placeholder').show();
    }
  }
  var oldstate = history.state || {};
  var newstate = {article: true, minilink: minilink}
  if(oldstate.minilink != newstate.minilink){
    history.pushState(newstate, '', `./articles/${minilink}`);
  }
  $("#view-tab-link").tab('show');
  window.scrollTo(0,0);
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
      $('#article-info-package').text(pkg.package + " " + pkg.version).attr("href", `./${pkg.package}`).click(function(e){
        e.preventDefault();
        tab_to_package(pkg.package);
      });
      $('#article-info-source').attr('href', server + "/" + pkg.package + '/doc/' + pkg.vignette.source).text(pkg.vignette.source);
      $('#article-info-html').attr('href', server + "/" + pkg.package + '/doc/'+ pkg.vignette.filename).text(pkg.vignette.filename);
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
      item.attr("href", `${server}/${pkg.package}/doc/${pkg.vignette.filename}`);
    } else {
      item.attr("href", `https://${pkg.user}.r-universe.dev/${pkg.package}/doc/${pkg.vignette.filename}`);
    }
    if(!pkg.vignette.filename.endsWith('html')){
      item.attr("target", "_blank")
    } else {
      item.click(function(e){
        e.preventDefault();
        if(pkg.user == user){
          display_article(minilink);
        } else {
          window.location.href = `https://${pkg.user}.r-universe.dev/articles/${minilink}`;
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
    var img = item.find('.maintainer-avatar').attr('src', avatar_url(pkg.login || "r-universe", 140));
    item.appendTo('#article-list-group');
  });
  if(x.length){
    $("#article-list-placeholder").hide();
  } else {
    $("#article-list-placeholder").text("No rmarkdown vignettes found in this universe.");
  }
  update_article_info();
}

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
        animation: false,
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
    const avatars = logins.map(x => avatar_url(x, size));
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
        window.location.href = `https://${user}.r-universe.dev/contributors`;
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
        content: `${latest ? 'Latest' : 'Version'}: ${x.name || x.version} (${x.date})`,
        position: 'start',
        yAdjust: -25
      }
    }
  });
}

function detail_update_chart(package, description){
  const releases = description._releases;
  const ctx = $('#package-updates-canvas').empty().attr('height', '300').height(300);
  const data = activity_data(description._updates.map(x => ({total:x.n, week:x.week})));
  const tags = tag_annotations(releases || description._tags || [], data);
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

function github_repo_info(repo){
  return github_api('/repos/' + repo).then(function(data){
    if(data.archived){
      $('.open-issues-count').text(`ARCHIVED on GitHub`)
    } else if(data.open_issues_count !== undefined){
      $('.open-issues-count').text(`${data.open_issues_count} issues`)
    }
  });
}

function populate_issue_tracker(src, details){
  $('.open-issues-count').empty();
  var tracker = guess_tracker_url(src);
  details.find(".package-details-issues a").text(tracker).attr('href', tracker);
  details.find(".package-details-issues").toggle(!!tracker);
  details.find(".package-details-notracker").toggle(!tracker);
  if(tracker){
    const ghrepo = tracker.match('github.com/([^/]+/[^/]+)');
    if(ghrepo){
      github_repo_info(ghrepo[1]);
    }
  }
}

function guess_tracker_url(src){
  var devurl = src._devurl || src._upstream;
  var upstream = devurl.replace('https://github.com/r-forge/', 'https://r-forge.r-project.org/projects/');
  if(upstream.match("github.com/(bioc|cran)/") || upstream.match("git.bioconductor.org/packages/"))
    return ""; //these are mirror urls
  if(upstream.match("github.com")){
    return upstream + '/issues';
  }
  return upstream;
}

function sortfun(a,b){
  return a.r < b.r ? 1 : -1;
}

function populate_download_links(x, details){
  var package = x.Package;
  var binaries = x._binaries || [];
  var wins = binaries.filter(x => x.os == 'win');
  var macs = binaries.filter(x => x.os == 'mac');
  var linux = binaries.filter(x => x.os == 'linux');
  var wasm = binaries.filter(x => x.os == 'wasm');
  var srcfile = `${package}_${x.Version}.tar.gz`;
  details.find('.package-details-source').attr('href', `${server}/src/contrib/${srcfile}`).text(srcfile);
  details.find('.package-details-json').attr('href', `${server}/api/packages/${package}`).text(`${package}/json`);
  wins.sort(sortfun).forEach(function(binary){
    var build = binary.r.substring(0,3);
    var filename = `${package}_${binary.version}.zip`;
    var winlinks = details.find('.package-details-windows');
    $("<a>").text(filename).attr('href', `${server}/bin/windows/contrib/${build}/${filename}`).appendTo(winlinks);
    winlinks.append(` (r-${build}) `)
  });
  macs.sort(sortfun).forEach(function(binary){
    var build = binary.r.substring(0,3);
    var arch = (binary.arch || "any").replace("aarch64", "arm64");
    var filename = `${package}_${binary.version}.tgz`;
    var maclinks = details.find('.package-details-macos');
    var platform = arch.match("arm64") ? 'big-sur-arm64' : 'big-sur-x86_64';
    $("<a>").text(filename).attr('href', `${server}/bin/macosx/${platform}/contrib/${build}/${filename}`).appendTo(maclinks);
    maclinks.append(` (r-${build}-${arch}) `)
  });

  linux.forEach(function(binary){
    var build = binary.r.substring(0,3);
    var distro = binary.distro || "unknown";
    var filename = `${package}_${binary.version}.tar.gz`;
    var linuxlinks = details.find('.package-details-linux');
    $("<a>").text(filename).attr('href', `${server}/bin/linux/${distro}/${build}/src/contrib/${filename}`).appendTo(linuxlinks);
    linuxlinks.append(` (r-${build}-${distro}) `)
  });
  wasm.sort(sortfun).forEach(function(binary){
    var build = binary.r.substring(0,3);
    var filename = `${package}_${binary.version}.tgz`;
    var wasmlinks = details.find('.package-details-wasm');
    $("<a>").text(filename).attr('href', `${server}/bin/emscripten/contrib/${build}/${filename}`).appendTo(wasmlinks);
    wasmlinks.append(` (r-${build}-emscripten) `)
  });
  $('.wasm-binaries').toggleClass('d-none', wasm.length == 0)
  $(".linux-binary-help").tooltip({title : "more information about linux binaries"});
  $(".wasm-binary-help").tooltip({title : "more information about WebAssembly"})
  details.find(".package-details-logs").attr('href', x._buildurl);
  details.find('.winmac-binaries').toggle(x._user !== 'cran');
}

function link_to_pkg(owner, pkg){
  if(owner === user)
    return `./${pkg}`;
  return `https://${owner}.r-universe.dev/${pkg}`
}

function populate_revdeps(package){
  var revdepdiv = $(".package-details-revdeps").empty();
  return get_ndjson(`https://r-universe.dev/stats/usedbyorg?package=${package}`).then(function(revdeps){
    function make_link(package, owner){
      return $("<a>")
      .text(package)
      .addClass('text-dark')
      .attr('href', link_to_pkg(owner, package))
      .click(function(e){
        if(owner == user){
          e.preventDefault();
          tab_to_package(package);
        }
      })
    }
    function add_one_user(){
      if(!revdeps.length) return;
      var x = revdeps.shift();
      var item = $("#templatezone .revdep-item").clone().appendTo(revdepdiv);
      item.find('.revdep-user-link').attr('href', 'https://' + x.owner + '.r-universe.dev');
      item.find('.revdep-user-avatar').attr('src', avatar_url(x.owner, 120));
      var packages = item.find('.revdep-user-packages');
      x.packages.sort((a,b) => a.stars > b.stars ? -1 : 1).forEach(function(pkg){
        packages.append(make_link(pkg.package, x.owner)).append(" ");
      });
    }
    var totalusers = revdeps.length;
    if(totalusers){
      for(var i = 0; i < 20; i++) add_one_user();
      if(revdeps.length){
        var morelink = $(`<button class="btn btn-sm btn-outline-primary m-2"><i class="fas fa-sync"></i> Show all ${totalusers} users</button>`).click(function(e){
          $(this).remove()
          e.preventDefault();
          while(revdeps.length) add_one_user();
        }).appendTo(revdepdiv);
      }
    } else {
      revdepdiv.append($("<i>").text(`No packages in r-universe depending on '${package}' yet.`))
    }
  });
}

function populate_readme(package){
  return get_path(`${server}/${package}/doc/readme?highlight=hljs`).then(function(res){
    var doc = $(res);
    doc.find("a").attr("target", "_blank").each(function(){
      if($(this).attr('href').startsWith("#")){
        $(this).removeAttr('href');
      }
    });
    doc.find("h1").addClass("h3");
    doc.find("h2").addClass("h4");
    doc.find("h3").addClass("h5"); /* Override bootstrap table css to prevent overflowing */
    doc.find("table").addClass("table table-sm").attr('style', 'display: block; overflow:auto; width: 0; min-width: 100%;');
    doc.find('img').addClass('d-none').on("load", function() {
      var img = $(this);
      /* Do not show badges and broken images */
      if(img[0].naturalHeight > 60 || img[0].naturalWidth > 300) {
        var islogo = img.attr('src').includes('logo');
        img.addClass('p-2').css('max-height', islogo ? '200px' : '400px').css('width', 'auto').css('max-width', '90%').removeClass('d-none');
      } else {
        img.remove();
      }
    });
    $('.package-readme-content').html(doc);
  });
}

function show_data_download(x, url, package){
  $('#download-data-modal h5').text(x.title);
  $('#download-data-modal .modal-body').empty().text("Loading...")
  $('#download-data-modal').modal('show');
  $('#download-data-modal .export-classname').empty().append(`${x.name} is a <b>${x.class.length && x.class[0]}</b>`);
  $('#download-data-modal .export-rda').attr('href', `${server}/${package}/data/${x.name}/rda`);
  $('#download-data-modal .export-rds').attr('href', `${server}/${package}/data/${x.name}/rds`);
  var isdf = Array.isArray(x.class) && x.class.includes('data.frame');
  $('#download-data-modal .export-csv').attr('href', `${server}/${package}/data/${x.name}/csv`).toggle(x.table === true);
  $('#download-data-modal .export-xlsx').attr('href', `${server}/${package}/data/${x.name}/xlsx`).toggle(x.table === true && isdf);
  //todo: once the db is all updated, /json below requires x.json and ndjson requires isdf && x.json
  $('#download-data-modal .export-ndjson').attr('href', `${server}/${package}/data/${x.name}/ndjson`).toggle(isdf && x.tojson !== false);
  $('#download-data-modal .export-json').attr('href', `${server}/${package}/data/${x.name}/json`).toggle(x.tojson !== false);
  $.get(url.replace("manual.html#", "page/"), function(str){
    var el = $.parseHTML(`<div>${str}</div>`);
    $(el).find("hr").remove();
    $(el).find("h2").remove();
    $(el).find("h3").addClass('h5');
    $(el).find("table").addClass('table table-sm table-responsive');
    $('#download-data-modal .modal-body').empty().append(el);
  });
}

function update_copy_gist(universe, package){
  var link = $('#copy-code-button').unbind("click");
  var tooltip_text = 'Copy to clipboard';
  link.click(function(e){
    var txt = (universe == 'cran') ?
    `install.packages("${package}", repos = "https://cran.r-project.org")` :
    `install.packages("${package}", repos = c("https://${universe}.r-universe.dev", "https://cran.r-project.org"))`;
    navigator.clipboard.writeText(txt).then(function(e){
      link.attr('data-original-title', 'Copied!').tooltip('show');
      link.attr('data-original-title', tooltip_text);
    });
    link.blur();
    return false;
  });
  link.tooltip({title: tooltip_text});
}

function populate_package_details(package){
  if(window.detailpkg == package) return;
  window.detailpkg = package;
  const old = Chart.getChart('package-updates-canvas');
  if(old) old.destroy();
  $('.plink').each(function(el){
    //workaround for basename breaking local links
    $(this).attr('href', package + $(this).attr('href').replace(/.*#/, '#'));
  });
  $('#package-details-spinner').show();
  $('.package-details-container .details-card').remove();
  $('.package-details-contributors').empty();
  $(".package-details-gist-name").text(package);
  $(".package-details-citation").addClass("d-none");
  $(".package-readme-content").empty();
  $(".package-citation-content").empty();
  $(".package-details-sha").empty();
  $(".last-build-status").empty();
  $('.package-details-installation-header').text(`Getting started with ${package} in R`);
  var details = $('#templatezone .details-card').clone();
  var promises = [populate_revdeps(package)];
  get_path(`${server}/api/packages/${package}`).then(function(src){
    if(!src){
      alert("Failed to find package " + package);
    }
    $('#package-details-spinner').hide();
    details.prependTo('.package-details-container');
    if(src._failure){
      details.find('.build-failure-alert').removeClass('d-none');
      details.find('.build-failure-url').attr('href', src._failure.buildurl);
    }
    $("head title").text(`R-universe: ${src._user}/${src.Package}`);
    var assets = src['_assets'] || [];
    if(assets.find(x => x.endsWith('citation.html'))){
      promises.push(get_path(`${server}/${package}/citation.html`).then(function(htmlString){
        var htmlDoc = (new DOMParser()).parseFromString(htmlString, "text/html");
        $(htmlDoc).find('.container').removeClass('container').appendTo('.package-citation-content');
        $(".package-details-citation").removeClass("d-none");
      }));
    }
    details.find('.package-details-header').text(`${src._owner}/${src.Package} ${src.Version}`);
    details.find('.package-details-name').text(`${src.Package}`)
    details.find('.package-details-title').text(src.Title);
    details.find('.package-details-description').text(src.Description);
    details.find('.package-details-author').text(normalize_authors(src.Author));
    details.find('.citation-link').attr('href', `${server}/${package}/citation.cff`);
    details.find('.package-json-link').attr('href', `${server}/api/packages/${package}`);
    details.find('.upstream-git-link').attr('href', src._upstream);
    populate_download_links(src, details);
    populate_issue_tracker(src, details);
    details.find('.package-details-topics').empty().append(make_topic_badges(src));
    if(assets.includes("manual.pdf")){
      details.find('.package-details-manual').text(`${src.Package}.pdf`).attr('href', `${server}/${package}/${package}.pdf`);
    }
    if(assets.includes(`extra/${package}.html`)){
      details.find('.package-details-htmlmanual').text(`${src.Package}.html`).attr('href', `${server}/${package}/doc/manual.html`);
    }
    var commit = src._commit;
    if(commit.time){
      var committext = `<p class="text-left">Author: ${commit.author.replace(/<.*>/, "")} <br> Date:   ${new Date(commit.time*1000).toString().substring(0, 25)}<br>Message: ${commit.message.replace('\n', '<br>')}</p>`;
      details.find('.package-details-sha').text(commit.id).attr('href',  `${src._upstream}/commit/${commit.id}`).tooltip({title: committext, html: true});
      details.find('.package-details-updated').text('Last updated ' + pretty_time_diff(src._commit.time));
      if(src.RemoteRef && src.RemoteRef != 'HEAD'){
        details.find('.package-details-remoteref').text(` (via ${src.RemoteRef})`);
      }
    }
    if(src._stars){
      details.find('.package-details-stars').attr("href", `${src._upstream}/stargazers`).removeClass('d-none').append(` ${countstr(src._stars)} stars`);
    }
    var rundeps = src._rundeps;
    if(rundeps){
      details.find('.package-details-dependencies').removeClass('d-none').append(` ${rundeps.length} dependencies`);
      $("#dependslist .labels").empty().append(make_badges(rundeps, 'danger', 'package:'));
    }
    if(src._usedby){
      details.find('.package-details-dependents').removeClass('d-none').append(` ${src._usedby} dependents`).attr('href', `https://r-universe.dev/search/?q=needs:${package}`)
    }
    if(src._score){
      details.find('.package-details-pkgscore').removeClass('d-none').append(` ${Math.pow(src._score-1, 2).toFixed(2)} score`);
    }
    if(src._exports){
      details.find('.package-details-exports').removeClass('d-none').append(` ${src._exports.length} exports`);
      if(assets.includes(`extra/${package}.html`)){
        $("#exportlist .labels").empty().append(make_exports_badges(src));
      } else {
        $("#exportlist .labels").empty().append(make_badges(src._exports, 'secondary', 'exports:'));
      }
    }
    if(src._help){
      make_help_table(src);
    }
    if(src._pkglogo){
      details.find('.package-details-logo').attr('src', src._pkglogo).addClass('d-md-block');
    }
    var maintainer = src._maintainer || {};
    details.find('.package-details-maintainer .maintainer-name').text(maintainer.name);
    if(maintainer.login !== user){
      details.find('.package-details-maintainer').removeClass('d-none');
    }
    if(maintainer.login){
      details.find('.package-details-maintainer a').attr('href', `https://${maintainer.login}.r-universe.dev`);
      details.find('.package-details-maintainer img').attr('src', avatar_url(maintainer.login, 140));
    }
    details.find(".metric-icons a").click(function(e){
      $(this).blur();
    });
    if(assets.includes("readme.html")){
      promises.push(populate_readme(package));
    }
    if(assets.includes("extra/NEWS.html")){
      details.find('.package-details-news').text(`NEWS`).attr('href', `${server}/${package}/NEWS`);
    } else {
      details.find('.details-news').hide()
    }
    var vignettes = src._vignettes;
    if(vignettes){
      var articles = details.find('.package-details-article-list');
      vignettes.forEach(function(x){
        var minilink = `${src.Package}/${x.filename}`;
        var item = $("#templatezone .package-details-article").clone();
        item.attr('href', `https://${src._user}.r-universe.dev/${src.Package}/doc/${x.filename}`);
        if(minilink.endsWith('html')){
          item.click(function(e){
            e.preventDefault();
            display_article(minilink);
          });
        }
        item.find('.detail-article-source').text(x.source);
        item.find('.detail-article-engine').text(x.engine);
        item.find('.detail-article-build').text(src._created.substring(0, 19).replace("T", " "));
        item.find('.article-modified').text('Last update: ' + (x.modified || "??").substring(0, 10));
        item.find('.article-created').text('Started: ' + (x.created || "??").substring(0, 10));
        item.find('.package-details-article-author').text(x.author);
        item.find('.article-title').text(x.title);
        item.appendTo(articles);
      });
    }
    if(src._status == 'failure'){
      details.find('.vignette-failure-url').attr('href', src._buildurl);
      details.find('.vignette-failure-alert').removeClass('d-none');
    }
    if(src._updates){
      detail_update_chart(package, src);
    }
    if(src._contributions){
      var names = Object.keys(src._contributions);
      var total = names.length;
      function add_one_contributor(){
        if(!names.length) return;
        var login = names.shift();
        var count = src._contributions[login];
        var item = $("#templatezone .package-details-contributor").clone();
        item.attr('href', `https://${login}.r-universe.dev/contributors`);
        item.find("img").attr('src', avatar_url(login, 160)).tooltip({title: `${login} made ${count} contributions to ${package}`});
        item.appendTo('.package-details-contributors');
      }
      for(let i = 0; i < 12; i++){
        add_one_contributor();
      }
      if(names.length){
        var morelink = $(`<button class="btn btn-sm btn-outline-primary m-2"><i class="fas fa-sync"></i> Show all (${total})</button>`).click(function(e){
          $(this).remove()
          e.preventDefault();
          while(names.length) add_one_contributor();
        }).appendTo('.package-details-contributors');
      }
    }
    // hide developmet chart for mirrors
    $('#development').toggle(!src._upstream.match("https://github.com/cran/"));
    var sysdeps = src._sysdeps;
    if(sysdeps){
      var sysdeplist = details.find('.system-library-list');
      var dupes = {};
      sysdeps.forEach(function(x){
        if(x.source == 'gcc' || x.source == 'glibc' || dupes[x.name]) return;
        dupes[x.name] = true;
        var li = $("<li>").appendTo(sysdeplist);
        $("<b>").text(x.name).appendTo(li);
        $("<i>").text(" – " + cleanup_desc(x.description) + " ").appendTo(li);
        $("<a>").attr("target", "_blank").attr('href', x.homepage).toggle(!!x.homepage).append($("<sup>").addClass("fas fa-external-link-alt")).appendTo(li);
        details.find(".system-library-row").removeClass('d-none');
      });
    }
    if(src._datasets){
      var datasetlist = details.find('.dataset-list');
      src._datasets.forEach(function(x){
        if(!x.name || !x.title) return;
        var li = $("<li>").appendTo(datasetlist);
        var url = help_page_url(package, src._help, x.name);
        if(!url) return; // probably "internal" dataset
        var a = $("<a>").addClass("font-weight-bold text-dark").attr('target', '_blank').attr('href', url).text(x.name).appendTo(li);
        $("<i>").text(" – " + cleanup_desc(x.title) + " ").appendTo(li);
        var lazydata = (src.LazyData || "").toLowerCase();
        if(lazydata == 'yes' || lazydata == 'true' || (x.file && !x.file.match(/\.R$/i))){
          var dlink = $('<a>').append('<small class="fas fa-download"></small>').attr('href', `${server}/${package}/data/${x.name}`).appendTo(li).click(function(e){
            e.preventDefault();
            show_data_download(x, url, package);
          });
        }
        details.find(".dataset-row").removeClass('d-none');
      });
    }
    generate_status_icon(src);
    update_copy_gist(src._user, package);
    var crandiv = details.find('.package-details-release').toggle(user != 'cran');
    if(src._bioc && src._bioc.length){
      crandiv.find('.release-title').text("On BioConductor:");

      // bioc has two branches: 'devel' or 'release'
      src._bioc.forEach(function(bioc){
        crandiv.find(`.${bioc.branch}-version`).text(`${package}-${bioc.version}`).attr('href', `https://bioconductor.org/packages/${bioc.branch}/bioc/html/${package}.html`);
        crandiv.find(`.${bioc.branch}-date`).text(`(bioc ${bioc.bioc}) `);
      });
    } else if(user != 'cran') {
      get_cran_status(package).then(function(x){
        if(x.version){
          var versiontxt = x.version === 'archived' ? `${package} (archived)` : `${package}-${x.version}`;
          crandiv.find('.release-version').text(versiontxt).attr('href', `https://cran.r-project.org/package=${package}`);
          if(x.date) {
            crandiv.find('.release-date').text(`(${x.date.substring(0,10)}) `);
          }
        } else {
          crandiv.append("no")
        }
        attach_cran_badge(package, src._upstream, crandiv.find('.release-comment'), "fa fa-check");
      });
    }
    /* force re-scroll to target after  async content after page load */
    Promise.allSettled(promises).then(function(){
      hash = window.location.hash;
      window.location.hash = "";
      window.location.hash = hash;
    });
  });
  get_path(`${server}/shared/scienceminer/${package}`).then(function(x){
    if(x.fields && x.fields.number_documents && x.fields.number_documents[0]){
      details.find(".package-details-mentions").removeClass('d-none').append(` ${x.fields.number_documents[0]} mentions`).attr("href", x.weburl);
    }
  }).catch((error) => {
    console.log(`No ScienceMiner data found ${package}`);
  });
  if(user == 'ropensci'){
    get_json('https://badges.ropensci.org/json/onboarded.json').then(function(onboarded){
      var reviewdata = onboarded.find(x => x.pkgname == package);
      if(reviewdata){
        var reviewdiv = details.find('.package-details-peerreview').removeClass('d-none');
        var reviewurl = `https://github.com/ropensci/software-review/issues/${reviewdata.iss_no}`
        var icon = $('<i class="fa fa-check"></i>').css('color', color_ok).tooltip({title: "Package has been peer reviewed by the rOpenSci community"});
        reviewdiv.find('.peerreview-status').append(reviewdata.status == 'reviewed' ? icon : `(${reviewdata.status})`);
        reviewdiv.find('.peerreview-link').attr("href", reviewurl).text("ropensci#" + reviewdata.iss_no);
      }
    }).catch((error) => {
      console.log("Failed to load onboarded.json")
    });
  }
}

function fail_status(x){
  return x && ["success", "skipped"].includes(x) == false;
}

function generate_status_icon(src){
  var os_type = src.OS_type
  var docfail = src._status != 'success';
  var winfail = fail_status(src._winbinary) && os_type != 'unix';
  var macfail = fail_status(src._macbinary) && os_type != 'windows';
  var statustxt = 'Articles and win/mac binaries OK'
  var success = true;
  if(docfail || winfail || macfail){
    var success = false;
    var statusarr = [];
    if(docfail) statusarr.push('Vignettes');
    if(winfail) statusarr.push('Windows');
    if(macfail) statusarr.push('MacOS');
    var statustxt = 'Build/check failure for ' + statusarr.join(', ');
  }
  var statusicon = $("<a>").attr("href", src._buildurl).appendTo(".last-build-status").addClass(success ? "fa fa-check" : "fa fa-question-circle").css('color', success ? color_ok : color_bad).tooltip({title: statustxt});

}

function tab_to_package(package, hash){
  window.scrollTo(0,0);
  var oldstate = history.state || {};
  var newstate = {package: package}
  if(oldstate.package != newstate.package){
    history.pushState(newstate, '', `./${package}${hash || ""}`)
  }
  populate_package_details(package);
  $("#package-tab-link").tab('show');
}

function cleanup_desc(str){
  if(!str) return "";
  var str = str.charAt(0).toUpperCase() + str.slice(1);
  return str.replace(/\(.*\)$/, '').replace('SASL -', 'SASL').replace(/[-,]+ .*(shared|runtime|binary|library|legacy|precision|quantum).*$/i, '');
}

function avatar_url(login, size){
  // use generic avatars for gitlab/bitbucket
  if(login.startsWith('gitlab-')) login = 'gitlab';
  if(login.startsWith('bitbucket-')) login = 'atlassian';
  login = login.replace('[bot]', '');
  return `https://r-universe.dev/avatars/${login}.png?size=${size}`;
}

function basename(x){
  return x.split(/[\\/]/).pop();
}

function activate_snapshot_panel(user){
  function update_dataset_url(){
    var selected = $('#api-dataset-data').find(":selected");
    var name = selected.attr('data-name');
    var package = selected.attr('data-package');
    var format = $('#api-dataset-format').val();
    var url = `https://${user}.r-universe.dev/${package}/data/${name}/${format}`;
    $("#api-dataset-url input").val(url);
    $("#api-dataset-url a").attr('href', url);
  }

  function update_packages_url(){
    var package = $('#api-package-select').val();
    var url = `https://${user}.r-universe.dev/api/packages/${package}`;
    $("#api-packages-url input").val(url);
    $("#api-packages-url a").attr('href', url);
  }
  function update_snapshot_url(){
    var types = $("input:checkbox[name=types]:checked").map(function(){return $(this).val()}).get().join();
    var binaries = $("input:checkbox[name=binaries]:checked").map(function(){return $(this).val()}).get().join();
    var packages = $('#api-snapshot-packages').val().join();
    var need_binaries = !types || types.match('win|mac|linux')
    var params = [];
    if(types.length){
      params.push(`types=${types}`);
    }
    if(binaries.length && need_binaries){
      params.push(`binaries=${binaries}`);
    }
    if(packages.length){
      params.push(`packages=${packages}`);
    }

    var url = `https://${user}.r-universe.dev/api/snapshot/zip`;
    if(params.length){
      url = url + "?" + params.join("&");
    }
    $("#api-snapshot-url input").val(url);
    $("#api-snapshot-url a").attr('href', url);
    $("input:checkbox[name=binaries]").prop('disabled', !need_binaries);
  }
  $('#snapshot-form input,#snapshot-form select').change(update_snapshot_url).trigger('change');
  $('#api-package-select').change(update_packages_url).trigger("change");
  $('#api-dataset-data,#api-dataset-format').change(update_dataset_url);
  get_json(`https://${user}.r-universe.dev/api/packages?fields=_datasets`).then(function(res){
    var pkglist = res.map(x => x.Package);
    pkglist.sort().forEach(pkg => $('<option>').text(pkg).appendTo('#api-snapshot-packages,#api-package-select'));
    res.forEach(function(x){
      var datasets = x._datasets;
      if(datasets){
        datasets.forEach(function(data){
          $('<option>').text(`${x.Package}::${data.name} (${data.class[0]})`).attr('data-package',x.Package).attr('data-name', data.name).appendTo('#api-dataset-data');
        });
      }
    });
    if($('#api-dataset-data option').length){
      $('#api-dataset-data').trigger('change')
    } else {
      $('#api-dataset-container').hide();
    };
  });
}

//INIT
var devtest = 'bioc'
var host = location.hostname;
var user = host.endsWith("r-universe.dev") ? host.split(".")[0] : devtest;
var server = host.endsWith("r-universe.dev") ? "" : 'https://' + user + '.r-universe.dev';

//Hack for relative links within subpages
if(server) $("head base").attr("href", location.pathname.replace(/[^/]*$/, ''))
$(".nocran").toggle(user != 'cran');
init_user_info(user, server).then(function(){
  init_maintainer_list(user, server);
  var isarticle = window.location.pathname.match(new RegExp('^(.*/)articles/(.*/.*)$'));
  if(!window.location.pathname){
    $('#builds-tab-link').click();
  } else if(isarticle){
    display_article(isarticle[2]);
    $("head base").attr("href", isarticle[1]);
  } else {
    var page_id = basename(window.location.pathname);
    if($(`#${page_id}-tab-link`).length){
      $(`#${page_id}-tab-link`).click();
    } else {
      tab_to_package(page_id, window.location.hash);
    }
  }
});
init_package_descriptions(server, user);
if(user == 'cran'){
  $('#api-tab-link').parent().hide();
} else {
  activate_snapshot_panel(user);
}

if(user == 'ropensci') {
  $("#thdocs").text("Docs");
}

var articledatapromise = init_article_data(server);
iFrameResize({ log: false, checkOrigin: false, warningTimeout: 0 }, '#viewerframe');
$('#articles-tab-link').one('shown.bs.tab', function (e) {
  articledatapromise.then(data => init_article_list(data, user));
});

$('#builds-tab-link').one('shown.bs.tab', function (e) {
  if(user == 'bioconductor' || user == 'cran') $(".nobioc").text("")
  //$(".nobioc").text("")
  make_activity_chart(user);
});
$('#contributors-tab-link').one('shown.bs.tab', function (e) {
  make_contributor_chart(user, 30);
});

$('#tab-list .nav-item:not(.d-none) .nav-link').on('show.bs.tab', function(e){
  var oldstate = history.state || {};
  var newstate = {tab: $(this).attr('id')}
  if(oldstate.tab != newstate.tab){
    history.pushState(newstate, '', $(this).attr("href").replace("#", "./"))
  }
});

$('#tab-list .nav-item .nav-link').on('show.bs.tab', function(e){
  var showtabs = $(this).attr('id') != 'package-tab-link';
  $('#tab-list').toggleClass('d-lg-flex', showtabs).toggleClass('d-lg-none', !showtabs).removeClass("show");
});


addEventListener('popstate', function(e){
  var state = e.state || {};
  //alert("pop:\n" + JSON.stringify(state))
  if(state.tab){
    $(`#${state.tab}`).tab('show');
  }
  if(state.package){
    tab_to_package(state.package);
  }
  if(state.article){
    display_article(state.minilink);
  }
});
