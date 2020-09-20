$(function(){
	get_ndjson('https://r-universe.dev/:any/stats/organizations').then(function(x){
		function order( a, b ) {
		  if(a.packages.length < b.packages.length) return 1;
		  if(a.packages.length > b.packages.length) return -1;
		  return 0;
		}
		x.sort(order).forEach(function(org){
			var profile = $("#templatezone .organization-profile").clone();
			profile.find(".organization-image").attr('data-src', 'https://github.com/' + org.organization + ".png")
			profile.find(".organization-homepage").attr('href', 'https://github.com/' + org.organization)
			profile.find(".organization-name").text(org.organization);
			//profile.find(".maintainer-more").text(maintainer.email);
			profile.find(".organization-packages").text(org.packages.length + " packages");
			profile.find(".organization-maintainers").text(org.maintainers.length + " maintainers");
			profile.appendTo("#organization-profile-list");
		});
		lazyload();
	});
});
