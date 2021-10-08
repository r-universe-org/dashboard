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

$(function(){
	get_ndjson('https://r-universe.dev/stats/maintainers').then(function(x){
		function order( a, b ) {
			if(a.packages.length < b.packages.length) return 1;
			if(a.packages.length > b.packages.length) return -1;
			return 0;
		}
		combine_duplicates(x).sort(order).forEach(function(maintainer){
			var organizations = {};
			var login = maintainer.login || "";
			maintainer.packages.forEach(function(pkg){
				if(pkg.user == 'test' || (""+pkg.registered) == "false") return;
				organizations[pkg.user] = organizations[pkg.user] ? organizations[pkg.user] + 1 : 1;
			});
			var profile = $("#templatezone .maintainer-profile").clone();
			if(login){
				profile.find(".maintainer-image").attr('data-src', 'https://r-universe.dev/avatars/' + login + ".png")
				profile.find(".maintainer-homepage").attr('href', 'https://github.com/' + login)
			}
			profile.find(".maintainer-name").text((maintainer.name || "").replace(/^'(.*)'$/, '$1')); //remove quoted names
			profile.find(".maintainer-more").append(maintainer.email);
			var total = 0;
			var orgcount = 0;
			for (const [org, count] of Object.entries(organizations)) {
				orgcount++;
				total = total + count;
				//if(login.toLowerCase() == org.toLowerCase()) continue;
				if(org.includes("gitlab.com")){
					var url = "https://upload.wikimedia.org/wikipedia/commons/1/18/GitLab_Logo.svg";
				} else {
					var url = 'https://r-universe.dev/avatars/' + org + ".png?size=60";
				}
				var firstname = maintainer.name.split(' ').shift();
				var icon = $("<img/>").addClass("zoom lazyload maintainer-org-icon border border-light rounded m-2").attr('data-src', url).width(45);
				var orglink = $("<a/>").attr('href', 'https://' + org + '.r-universe.dev').append(icon);
				var tiptext = firstname + ' maintains ' + count + " <b>" + org + "</b> package" + (count > 1 ? "s" : "");
            	orglink.tooltip({title: tiptext, html: true});
				profile.find(".maintainer-organizations").append(orglink);	
			}
			profile.find(".maintainer-packages").text(total + " packages");
			//profile.find(".maintainer-organizations").text(JSON.stringify(organizations));
			profile.appendTo("#maintainer-profile-list");
		});
		lazyload();
	});
});
