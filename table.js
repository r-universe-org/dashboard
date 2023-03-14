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

function make_sysdeps(pkg, distro){
  if(pkg && pkg.sysdeps){
    var div = $("<div>").css("max-width", "33vw");
    var unique = {};
    pkg.sysdeps.forEach(x => unique[x.name] = x);
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

function init_packages_table(org = ":any", maintainer = ""){
  let tbody = $("#packages-table-body");
  var checkurl = 'https://r-universe.dev/stats/builds';
  ndjson_batch_stream(checkurl, function(batch){
    batch.forEach(function(pkg){
      //console.log(pkg)
      var name = pkg.package;
      var src = pkg.runs && pkg.runs.find(x => x.type == 'failure') || pkg.runs.find(x => x.type == 'src') || {};
      var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.3') || {skip: pkg.os_restriction === 'unix'}; //{type:'pending'};
      var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.3') || {skip: pkg.os_restriction === 'windows'}; //{type:'pending'}
      var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.2') || {skip: pkg.os_restriction === 'unix'};
      var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.2') || {skip: pkg.os_restriction === 'windows'};
      var commiturl = `${pkg.upstream}/commit/${pkg.commit}`;
      var versionlink = $("<a>").text(pkg.version).attr("href", commiturl).attr("target", "_blank").addClass('text-dark');
      var commitdate = new Date(pkg.timestamp * 1000 || NaN).yyyymmdd();
      var sysdeps = make_sysdeps(pkg, src.distro);
      var userlink = $("<a>").text(pkg.user).attr("href", "https://" + pkg.user + ".r-universe.dev").addClass('text-secondary');
      var maintainerlink = pkg.maintainerlogin ? $("<a>").attr("href", "https://" + pkg.maintainerlogin + ".r-universe.dev") :  $("<span>")
      maintainerlink.text(pkg.maintainer).addClass('text-secondary');
      var pkgname = pkg.package;
      var pkglink = $("<a>").text(pkgname).attr('href', `https://${pkg.user}.r-universe.dev/${name}`);
      if(pkg.os_restriction){
        pkglink = pkglink.append($("<small>").addClass('pl-1 font-weight-bold').text("(" + pkg.os_restriction + " only)"));
      }
      if(src.type){
        var row = tr([commitdate, userlink, pkglink, versionlink, maintainerlink, run_icon(src, src),
          [run_icon(win, src), run_icon(mac, src)], [run_icon(oldwin, src), run_icon(oldmac, src)], sysdeps]);
        if(src.type === 'failure'){
          pkglink.css('text-decoration', 'line-through').after($("<a>").attr("href", src.url).append($("<small>").addClass('pl-1 font-weight-bold').text("(build failure)").css('color', 'red')));
        }
        tbody.append(row);
      } else {
        console.log("Not listing old version: " + name + " " + pkg.version )
      }
    });
  }).catch(alert).then(function(x){
    $("#placeholder").hide();
    var defs = [{
      targets: [5, 6, 7],
      className: 'dt-body-center',
      orderable: false
    }];
    window.table = $("table").DataTable({
      paging: false,
      lengthChange: false,
      fixedHeader: true,
      columnDefs: defs,
      order: [[ 0, "desc" ]]
    });
    //$('div.dataTables_filter').appendTo("thead").css('margin-bottom', '-80px').css('padding', 0).css('float', 'right');
  });
};
