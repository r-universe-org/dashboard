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

function run_icon(run){
  if(run.skip)
    return $("<b>").text("-").css('padding-right', '4px').css('padding-left', '7px').css('color', 'slategrey');
  if(run.type == 'pending')
    return $('<span></span>')
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
		} else if(run.type == 'src'){
			i.css('color', '#cb2431');
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

function init_packages_table(org = ":any", maintainer = ""){
	let tbody = $("#packages-table-body");
	var checkurl = 'https://r-universe.dev/stats/checks?limit=200&maintainer=' + maintainer;
	get_ndjson(checkurl).then(function(cranlike){
		cranlike.forEach(function(pkg){
			//console.log(pkg)
			var name = pkg.package;
			var src = pkg.runs && pkg.runs.find(x => x.type == 'src') || {};
			var win = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'unix'}; //{type:'pending'};
			var mac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.1') || {skip: pkg.os_restriction === 'windows'}; //{type:'pending'}
			var oldwin = pkg.runs && pkg.runs.find(x => x.type == 'win' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'unix'};
			var oldmac = pkg.runs && pkg.runs.find(x => x.type == 'mac' && x.built.R.substring(0,3) == '4.0') || {skip: pkg.os_restriction === 'windows'};
			var buildinfo = src.builder || pkg.runs[0].builder;
			var published = (new Date(buildinfo && buildinfo.timestamp * 1000 || NaN)).yyyymmdd();
			var builddate = (new Date(buildinfo && buildinfo.date * 1000 || NaN)).yyyymmdd();
			var sysdeps = make_sysdeps(src.builder);
			var userlink =  $("<a>").text(pkg.user).
				attr("href", "https://" + pkg.user + ".r-universe.dev");
			var pkgname = pkg.package;
			if(pkg.os_restriction){
				pkgname = pkgname + " <b>(" + pkg.os_restriction + " only)</b>";
			}
			if(src.builder){
			tbody.append(tr([published, userlink, pkgname, pkg.version, pkg.maintainer, run_icon(src),
				builddate, [run_icon(win), run_icon(mac)], [run_icon(oldwin), run_icon(oldmac)], sysdeps]));
			} else {
				console.log("Not listing old version: " + name + " " + pkg.version )
			}
		});
	}).catch(alert).then(function(x){
    $("#placeholder").hide();
		var defs = [{
			targets: [5, 6, 7, 8],
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
