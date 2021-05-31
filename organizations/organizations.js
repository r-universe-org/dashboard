$(function(){
	get_ndjson('https://r-universe.dev/stats/organizations').then(function(x){
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
				function set_org_image(res){
					if(!res || !res.avatar_url) return;
					profile.find(".organization-image").attr('src', res.avatar_url.replace(/s=\d+/, 's=400'));
				}
				$.get("https://gitlab.com/api/v4/users?username=" + organization, res => set_org_image(res[0]));
				$.get("https://gitlab.com/api/v4/groups/" + organization, res => set_org_image(res));
			} else {
				profile.find(".organization-image").attr('data-src', 'https://r-universe.dev/avatars/' + organization + ".png");
				profile.find(".organization-homepage").attr('href', 'https://' + organization + '.r-universe.dev');
				profile.find(".organization-name").text(organization);
			}
			//profile.find(".maintainer-more").text(maintainer.email);
			profile.find(".organization-universe").attr('href', 'https://github.com/r-universe/' + org.organization);
			profile.find(".organization-packages").text(org.packages.length + " packages");
			profile.find(".organization-maintainers").text(org.maintainers.length + " maintainers");
			profile.appendTo("#organization-profile-list");
		});
		lazyload();
	});
});
