$(function(){
	get_ndjson('https://r-universe.dev/:any/stats/maintainers').then(function(x){
		function order( a, b ) {
		  if(a.packages.length < b.packages.length) return 1;
		  if(a.packages.length > b.packages.length) return -1;
		  return 0;
		}
		x.sort(order).forEach(function(maintainer){
			var organizations = {};
			maintainer.packages.forEach(function(pkg){
				if(pkg.user == 'test') return;
				organizations[pkg.user] = organizations[pkg.user] ? organizations[pkg.user] + 1 : 1;
			});
			var profile = $("#templatezone .maintainer-profile").clone();
			if(maintainer.login){
				profile.find(".maintainer-image").attr('data-src', 'https://github.com/' + maintainer.login + ".png")
				profile.find(".maintainer-homepage").attr('href', 'https://github.com/' + maintainer.login)
			}
			profile.find(".maintainer-name").text(maintainer.name);
			profile.find(".maintainer-more").text(maintainer.email);
			var total = 0;
			for (const [org, count] of Object.entries(organizations)) {
				total = total + count;
				if(maintainer.login != org){
					var icon = $("<img/>").addClass("lazyload maintainer-org-icon border border-light rounded m-2").attr('src', 'https://github.com/' + org + ".png?size=60").width(30);
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
