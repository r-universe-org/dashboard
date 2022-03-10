$(function(){
  get_ndjson('https://r-universe.dev/stats/universes').then(function(x){
    x.forEach(function(org){
      var organization = org.universe;
      // uncomment when database is updated
      // This will not show orgs that do not have self-owned packages
      // if(!org.owners.find(x => x.owner == organization && x.organization)) return;
      if(organization == 'test') return;
      var profile = $("#templatezone .organization-profile").clone();
      if(organization.includes('gitlab.com')){
        organization = organization.split("_")[0];
        profile.find(".organization-homepage").attr('href', 'https://gitlab.com/' + organization);
        profile.find(".organization-name").text(organization + "@gitlab");
        function set_org_image(res){
          if(!res || !res.avatar_url) return;
          profile.find(".organization-image").attr('data-src', res.avatar_url.replace(/s=\d+/, 's=400'));
        }
        $.get("https://gitlab.com/api/v4/users?username=" + organization, res => set_org_image(res[0]));
        $.get("https://gitlab.com/api/v4/groups/" + organization, res => set_org_image(res));
      } else {
        profile.find(".organization-image").attr('data-src', 'https://r-universe.dev/avatars/' + organization + ".png");
        profile.find(".organization-homepage").attr('href', 'https://' + organization + '.r-universe.dev');
        profile.find(".organization-name").text(organization);
      }
      //profile.find(".maintainer-more").text(maintainer.email);
      profile.find(".organization-subtitle").text('Updated: ' + new Date(org.updated * 1000 || NaN).toLocaleString());
      profile.find(".organization-universe").attr('href', 'https://github.com/r-universe/' + org.organization);
      profile.find(".organization-packages").text(org.packages.length + " packages");
      profile.find(".organization-maintainers").text(org.maintainers.length + " maintainers");
      profile.appendTo("#organization-profile-list");
    });
    lazyload();
  });
});
