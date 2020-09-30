$(function(){
	get_ndjson('https://r-universe.dev/:any/stats/organizations').then(function(x){
		function order( a, b ) {
		  if(a.packages.length < b.packages.length) return 1;
		  if(a.packages.length > b.packages.length) return -1;
		  return 0;
		}
		x.sort(order).forEach(function(org){
			var organization = org.organization;
			if(organization == 'test') return;
			var profile = $("#templatezone .organization-profile").clone();
			if(organization.includes('gitlab.com')){
				organization = organization.split("_")[0];
				profile.find(".organization-homepage").attr('href', 'https://gitlab.com/' + organization);
				profile.find(".organization-name").text(organization + "@gitlab");
				$.get("https://gitlab.com/api/v4/users?username=" + organization, function(res) {
					if(res.length){
						var url = res[0].avatar_url.replace(/s=\d+/, 's=400');
						profile.find(".organization-image").attr('src', url);
					} else {
						$.get("https://gitlab.com/api/v4/groups/" + organization, function(res) {
							var url = res.avatar_url.replace(/s=\d+/, 's=400');
							profile.find(".organization-image").attr('src', url);
						});
					}
				});
			} else {
				profile.find(".organization-image").attr('data-src', 'https://github.com/' + organization + ".png");
				profile.find(".organization-homepage").attr('href', 'https://github.com/' + organization);
				profile.find(".organization-name").text(organization);
			}
			//profile.find(".maintainer-more").text(maintainer.email);
			profile.find(".organization-packages").text(org.packages.length + " packages");
			profile.find(".organization-maintainers").text(org.maintainers.length + " maintainers");
			profile.appendTo("#organization-profile-list");
		});
		lazyload();
	});
});
