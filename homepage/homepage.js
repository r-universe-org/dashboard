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

function run_icon(run){
    var iconmap = {
        src : "linux",
        win : "windows",
        mac : "apple"
    };
    if(run && run.builder){
        var i = $("<i>", {class : 'fab fa-' + iconmap[run.type]});
        var a = $("<a>").attr('href', run.builder.url).append(i).css('margin-left', '5px');
         // can be "success" or "Succeeded"
        if(run.builder.status.match(/succ/i)){
            i.css('color', '#22863a');
        } else {
            i.css('color', 'slategrey');
        }
        return $('<span></span>').append(a);
    } else {
        return $("<i>", {class : 'fa fa-times'}).css('margin-left', '5px').css('color', '#cb2431');
    }
}

function docs_icon(job){
    if(job && job.url){
        var i = $("<i>", {class : 'fa fa-book'});
        var a = $("<a>").attr('href', job.url).append(i);
        if(job.color == 'red'){
            a.css('color', '#e05d44');
        }
        return $('<span></span>').append(a);
    }
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

function init_packages_table(server, user){
    let tbody = $("#packages-table-body");
    var initiated = false;
    ndjson_batch_stream(server + '/stats/checks', function(batch){
        if(!initiated && batch.length > 0){
            initiated = true;
            init_syntax_block(user, batch[0].package);
        }
        batch.forEach(function(pkg){
            //console.log(pkg)
            var name = pkg.package;
            var src = pkg.runs && pkg.runs.find(x => x.type == 'src') || {};
            var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.0') || {};
            var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.0') || {};
            var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '3.6') || {};
            var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '3.6') || {};
            var published = (new Date(pkg.runs[0].builder && pkg.runs[0].builder.timestamp * 1000 || NaN)).yyyymmdd();
            var builddate = (new Date(pkg.runs[0].builder && pkg.runs[0].builder.date * 1000 || NaN)).yyyymmdd();
            var sysdeps = make_sysdeps(src.builder);
            var pkglink = $("<a>").text(pkg.package).
                attr("href", src.builder ? src.builder.upstream : undefined).
                attr("target", "_blank");
            if(src.builder){
            tbody.append(tr([published, pkglink, pkg.version, pkg.maintainer, run_icon(src),
                builddate, [run_icon(win), run_icon(mac)], [run_icon(oldwin), run_icon(oldmac)], sysdeps]));
            } else {
                console.log("Not listing old version: " + name + " " + pkg.version )
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

function init_github_info(ghuser){
    $("head title").text("R-universe: " + ghuser);
    $(".title-universe-name").text(ghuser);
    $("#github-user-avatar").attr('src', 'https://github.com/' + ghuser + '.png');
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
                item.find('.maintainer-avatar').attr('src', 'https://github.com/' + maintainer.login + '.png?size=140');
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

function init_package_descriptions(server){
    //$('#packages-tab-link').one('shown.bs.tab', function (e) {
        get_ndjson(server + '/stats/descriptions').then(function(x){
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
                if(buildinfo.pkglogo){
                    if(!buildinfo.pkglogo.startsWith('http')){
                        buildinfo.pkglogo = buildinfo.upstream + '/raw/HEAD/' + buildinfo.pkglogo;
                    }
                    item.find('.package-image').attr('src', buildinfo.pkglogo);
                } else if(buildinfo.maintainerlogin){
                    item.find('.package-image').attr('src', 'https://github.com/' + buildinfo.maintainerlogin + '.png');
                }
                item.appendTo('#package-description-col-' + ((i%2) ? 'two' : 'one'));
            });
            if(x.length){
              $("#package-description-placeholder").hide();
            } else {
              $("#package-description-placeholder").text("No packages found in this username.");
            }
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
        $('#article-info-author').text(pkg.maintainer.split("<")[0]);
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
              item.find('.article-author-name').text(pkg.maintainer.split("<")[0]);
              item.find('.article-modified').text('Last update: ' + (pkg.vignette.modified || "??").substring(0, 10));
              item.find('.article-created').text('Started: ' + (pkg.vignette.created || "??").substring(0, 10));
              if(pkg.maintainerlogin){
                item.find('.maintainer-avatar').attr('src', 'https://github.com/' + pkg.maintainerlogin + '.png?size=140');
              }
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
var devtest = 'r-spatial'
var host = location.hostname;
var user = host.endsWith("r-universe.dev") ? host.split(".")[0] : devtest;
var server = host.endsWith("r-universe.dev") ? "" : 'https://' + user + '.r-universe.dev';
init_github_info(user).then(function(){init_maintainer_list(server)});
init_packages_table(server, user);
init_package_descriptions(server);
init_article_list(server);

$('a[data-toggle="tab"]').historyTabs();
