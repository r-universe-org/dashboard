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
				if(pkg.user == 'test') return;
				organizations[pkg.user] = organizations[pkg.user] ? organizations[pkg.user] + 1 : 1;
			});
			var profile = $("#templatezone .maintainer-profile").clone();
			if(login){
				profile.find(".maintainer-image").attr('data-src', 'https://github.com/' + login + ".png")
				profile.find(".maintainer-homepage").attr('href', 'https://github.com/' + login)
			}
			profile.find(".maintainer-name").text(maintainer.name);
			profile.find(".maintainer-more").append(maintainer.email);
			var total = 0;
			for (const [org, count] of Object.entries(organizations)) {
				total = total + count;
				if(login.toLowerCase() != org.toLowerCase()){
					if(org.includes("gitlab.com")){
						var url = "https://upload.wikimedia.org/wikipedia/commons/1/18/GitLab_Logo.svg";
					} else {
						var url = 'https://github.com/' + org + ".png?size=60";
					}
					var icon = $("<img/>").addClass("lazyload maintainer-org-icon border border-light rounded m-2").attr('src', url).width(30);
					profile.find(".maintainer-organizations").append(icon);
				}		
			}
			profile.find(".maintainer-packages").text(total + " packages");
			//profile.find(".maintainer-organizations").text(JSON.stringify(organizations));
			profile.appendTo("#maintainer-profile-list");
		});
		lazyload();
	});
});
