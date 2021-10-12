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
                    var end = res.lastIndexOf('\n', e.currentTarget.response - start);
                    if(end > 0){
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

function docs_icon(pkg, run){
    if(run && run.builder){
        var i = $("<i>", {class : 'fa fa-book'});
        var a = $("<a>").attr('href', run.builder.url).append(i).css('margin-left', '5px');
        if(run.builder.pkgdocs){
            if(run.builder.registered === 'false'){
              /* This is a 'remote' package */
              return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', color_meh);
            }
            if(run.builder.pkgdocs.match(/succ/i)){
                i.css('color', color_ok);
                a.attr('href', 'https://docs.ropensci.org/' + pkg).attr("target", "_blank");
            } else {
                i.css('color', color_bad);
            }
            return $('<span></span>').append(a);
        }
    }
}

function run_icon(run, src){
    if(run.skip)
        return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', color_meh);
    if(run.type == 'pending')
      return $('<span></span>')
    var iconmap = {
        src : "fab fa-linux",
        win : "fab fa-windows",
        mac : "fab fa-apple",
        failure: "fa fa-times"
    };
    if(run && run.builder){
        var i = $("<i>", {class : iconmap[run.type]});
        var a = $("<a>").attr('href', run.builder.url).append(i).css('margin-left', '5px');
         // can be "success" or "Succeeded"
        if(run.builder.status && run.builder.status.match(/succ/i)){
            i.css('color', color_ok);
        } else if(run.type == 'src' || run.type == 'failure'){
            i.css('color', color_bad);
        } else {
            i.css('color', color_meh);
        }
    } else {
        var i = $("<i>", {class : 'fa fa-times'}).css('margin-left', '5px').css('color', '#cb2431');
        var a = $("<a>").attr('href', src.builder.url).append(i);
    }
    return $('<span></span>').append(a);
}

function make_sysdeps(builder){
    if(builder && builder.sysdeps){
        var div = $("<div>").css("max-width", "33vw");
        if(Array.isArray(builder.sysdeps)){
            builder.sysdeps.forEach(function(x){
                var name = x.package;
                //var url = 'https://packages.debian.org/testing/' + name;
                var distro = builder.distro;
                if(distro == "$(OS_DISTRO)")
                    distro = 'bionic'
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

async function get_metadata(user){
    var url = 'https://raw.githubusercontent.com/r-universe/' + user + '/master/.metadata.json';
    const response = await fetch(url);
    if (response.ok)
        return response.json();
    throw new Error("HTTP Error: " + response.status)
}

function attach_cran_badge(name, url, el){
    metadata.then(function(pkgs){
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
    var initiated = false;
    var rows = {};
    ndjson_batch_stream(server + '/stats/checks', function(batch){
        if(!initiated && batch.length > 0){
            initiated = true;
            init_syntax_block(user, batch[0].package);
        }
        batch.forEach(function(pkg){
            //console.log(pkg)
            var name = pkg.package;
            var src = pkg.runs && pkg.runs.find(x => x.type == 'failure') || pkg.runs.find(x => x.type == 'src') || {};
            var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'unix'}; //{type:'pending'};
            var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'windows'}; //{type:'pending'};
            var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'unix'};
            var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'windows'};
            var buildinfo = src.builder || pkg.runs[0].builder;
            var published = (new Date(buildinfo && buildinfo.timestamp * 1000 || NaN)).yyyymmdd();
            var builddate = (new Date(buildinfo && buildinfo.date * 1000 || NaN)).yyyymmdd();
            var sysdeps = make_sysdeps(src.builder);
            var pkglink = $("<a>").text(pkg.package).
                attr("href", src.builder ? src.builder.upstream : undefined).
                attr("target", "_blank");
            if(buildinfo.registered === 'false'){
              pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(via remote)"));
            }
            if(pkg.os_restriction){
              pkglink = $("<span>").append(pkglink).append($("<small>").addClass('pl-1 font-weight-bold').text("(" + pkg.os_restriction + " only)"));
            }
            if(src.builder){
                var docslink = (user == 'ropensci') ? docs_icon(name, src) : "";
                var row = tr([published, pkglink, pkg.version, pkg.maintainer, docslink, run_icon(src), builddate,
                  [run_icon(win, src), run_icon(mac, src)], [run_icon(oldwin, src), run_icon(oldmac, src)], sysdeps]);
                if(src.type === 'failure'){
                  pkglink.css('text-decoration', 'line-through').after($("<a>").attr("href", src.builder.url).append($("<small>").addClass('pl-1 font-weight-bold').text("(build failure)").css('color', 'red')));
                } else {
                  attach_cran_badge(name, buildinfo.upstream, pkglink);
                }
                rows[name] ? rows[name].after(row) : tbody.append(row);
                rows[name] = row;
            } else {
                console.log("Not listing old win/mac binaries: " + name + " " + pkg.version )
            }
        });
    }).then(function(){
        if(initiated){
          $("#package-builds-placeholder").hide();
        } else {
          $("#package-builds-placeholder").text("No packages found in this username.");
        }
    }).catch(alert);
};

function update_registry_status(ghuser){
  const tooltip_success = "Universe registry is up to date";
  const tooltip_failure = "There was a problem updating the registry. Please inspect the log files.";
  const url = 'https://api.github.com/repos/r-universe/' + ghuser + '/actions/workflows/sync.yml/runs?per_page=1&status=completed';
  $("#registry-status-link").attr("href", 'https://github.com/r-universe/' + ghuser + '/actions/workflows/sync.yml');
  return get_json(url).then(function(data){
    const success = data.workflow_runs[0].conclusion == 'success';
    if(data && data.workflow_runs && data.workflow_runs.length) {
      $("#registry-status-icon")
        .addClass(success ? 'fa-check' : 'fa-exclamation-triangle')
        .addClass(success ? 'text-success' : 'text-danger')
        .tooltip({title: success ? tooltip_success : tooltip_failure});
    } else {
      throw "Failed to get workflow data";
    }
  }).catch(function(err){
    $("#registry-status-icon").addClass('fa-times').addClass('text-danger');
    console.log(err);
  }).finally(function(e){
     $("#registry-status-spinner").hide();
  });
}

function init_github_info(ghuser){
    $("head title").text("R-universe: " + ghuser);
    $(".title-universe-name").text(ghuser);
    $("#github-user-avatar").attr('src', 'https://r-universe.dev/avatars/' + ghuser + '.png');
    $("#github-user-universe").append(a('https://github.com/r-universe/' + ghuser, "r-universe/" + ghuser));
    return get_json('https://api.github.com/users/' + ghuser).then(function(user){
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
        update_registry_status(ghuser);
    }).catch(alert);
}


/* Combine maintainers with multiple emails, based on Github login (if known) */ 
function combine_duplicates(maintainer){
    var list = {};
    maintainer.forEach(function(x){
        var key = x.login || x.email;
        if(list[key]){
            list[key].packages = list[key].packages.concat(x.packages);
            list[key].email = list[key].email + "<br/>" + x.email;
        } else {
            list[key] = x;
        }
    });
    return Object.keys(list).map(key => list[key]);
}

function init_maintainer_list(server){
    get_ndjson(server + '/stats/maintainers').then(function(x){
        function order( a, b ) {
            if(a.packages.length < b.packages.length) return 1;
            if(a.packages.length > b.packages.length) return -1;
            return 0;
        }
        combine_duplicates(x).sort(order).forEach(function(maintainer){
            var item = $("#templatezone .maintainer-item").clone();
            item.find('.maintainer-name').text(maintainer.name)
            if(maintainer.login){
                item.find('.maintainer-avatar').attr('src', 'https://r-universe.dev/avatars/' + maintainer.login + '.png?size=140');
            }
            item.appendTo('#maintainer-list');
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
    var ghuser = buildinfo.maintainerlogin || "r-universe";
    return 'https://r-universe.dev/avatars/' + ghuser + '.png?size=140';
}

function init_package_descriptions(server, user){
    function add_badge_row(name){
        var tr = $("<tr>").appendTo($("#badges-table-body"));
        const badge_url = "https://" + user + ".r-universe.dev/badges/" + name;
        const badge_text = "https://" + user + ".r-universe.dev/badges/<b>" + name + "</b>";
        $("<td>").append($("<a>").attr("target", "_blank").attr("href", badge_url).append(badge_text).addClass('text-monospace')).appendTo(tr);
        $("<td>").append($("<img>").attr("data-src", badge_url).addClass("lazyload")).appendTo(tr);
        const md_icon = $('<a class="fab fa-markdown fa-lg">');
        const tooltip_text = 'Copy to clipboard';
        md_icon.tooltip({title: tooltip_text, placement: 'left'});
        md_icon.on("click", function(e){
            const text = `[![${name} status badge](${badge_url})](https://${user}.r-universe.dev)`;
            navigator.clipboard.writeText(text).then(function(e){
              md_icon.attr('data-original-title', 'Copied!').tooltip('show');
              md_icon.attr('data-original-title', tooltip_text);
            });
        });
        $("<td>").append(md_icon).appendTo(tr);
    }
    //$('#packages-tab-link').one('shown.bs.tab', function (e) {
        get_ndjson(server + '/stats/descriptions').then(function(x){
            add_badge_row(":name");
            add_badge_row(":registry");
            add_badge_row(":total");
            function order( a, b ) {
                if(a['_builder'].timestamp < b['_builder'].timestamp) return 1;
                if(a['_builder'].timestamp > b['_builder'].timestamp) return -1;
                return 0;
            }
            x.sort(order).forEach(function(pkg, i){
                //console.log(pkg)
                var item = $("#templatezone .package-description-item").clone();
                item.find('.package-name').text(pkg.Package);
                item.find('.package-maintainer').text(pkg.Maintainer.split("<")[0]);
                item.find('.package-title').text(pkg.Title);
                item.find('.package-description').text(pkg.Description.replace('\n', ' '));
                //item.find('.package-dependencies').text("Dependencies: " + pretty_dependencies(pkg));
                const buildinfo = pkg['_builder'];
                if(buildinfo.timestamp){
                    item.find('.description-last-updated').text('Last updated ' + pretty_time_diff(buildinfo.timestamp));
                }
                item.find('.package-image').attr('src', get_package_image(buildinfo));
                item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
                attach_cran_badge(pkg.Package, buildinfo.upstream, item.find('.cranbadge'));
                add_badge_row(pkg.Package);
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
        $('#article-info-package').text(pkg.package + " " + pkg.version);
        $('#article-info-source').attr('href', server + "/articles/" + pkg.package + '/' + pkg.vignette.source).text(pkg.vignette.source);
        $('#article-info-html').attr('href', server + "/articles/" + pkg.package + '/'+ pkg.vignette.filename).text(pkg.vignette.filename);
        $('#article-info-date').text((pkg.vignette.modified || "??").substring(0, 10));
    }
}

function init_article_list(server){
    iFrameResize({ log: false, checkOrigin: false }, '#viewerframe');
    //$('#articles-tab-link').one('shown.bs.tab', function (e) {
        get_ndjson(server + '/stats/vignettes').then(function(x){
            function order( a, b ) {
                if(a.vignette.modified < b.vignette.modified) return 1;
                if(a.vignette.modified > b.vignette.modified) return -1;
                return 0;
            }
            x.sort(order).forEach(function(pkg, i){
              var item = $("#templatezone .article-item").clone();
              var minilink = pkg.package + "/" + pkg.vignette.filename;
              articledata[minilink] = pkg;
              item.attr("href", server + "/articles/" + minilink);
              if(!pkg.vignette.filename.endsWith('html')){
                  item.attr("target", "_blank")
              } else {
                  item.click(function(e){
                      e.preventDefault();
                      navigate_iframe(minilink);
                      $("#view-tab-link").tab('show');
                      window.scrollTo(0,0);
                  });
              }
              item.find('.article-title').text(pkg.vignette.title);
              item.find('.article-package-version').text(pkg.package + " " + pkg.version);
              item.find('.article-author-name').text(pkg.vignette.author || pkg.maintainer.split("<")[0]);
              item.find('.article-modified').text('Last update: ' + (pkg.vignette.modified || "??").substring(0, 10));
              item.find('.article-created').text('Started: ' + (pkg.vignette.created || "??").substring(0, 10));
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

function init_syntax_block(user, package){
    var template = `# Enable this universe
options(repos = c(
    {{opt}} = 'https://{{user}}.r-universe.dev',
    CRAN = 'https://cloud.r-project.org'))

# Install some packages
install.packages('{{package}}')`
    var cleanuser = user.replace(/\W/g, '');
    var text = template.replace("{{opt}}", cleanuser).replace('{{user}}', user).replace('{{package}}', package);
    var code = $("<code>").addClass("language-r").text(text).appendTo('#example-install-code');
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
var devtest = 'jeroen'
var host = location.hostname;
var user = host.endsWith("r-universe.dev") ? host.split(".")[0] : devtest;
var server = host.endsWith("r-universe.dev") ? "" : 'https://' + user + '.r-universe.dev';
const metadata = get_metadata(user);
init_github_info(user).then(function(){init_maintainer_list(server)});
init_packages_table(server, user);
init_package_descriptions(server, user);
init_article_list(server);

$('a[data-toggle="tab"]').historyTabs();
