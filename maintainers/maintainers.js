$(function(){
  var maintainerdata = [];
  function process_batch(n){
    n = n || 24;
    if(maintainerdata.length == 0){
      $(window).unbind('scroll');
      return;
    }
    for (let i = 0; i < n; i++) {
      var maintainer = maintainerdata.shift();
      if(!maintainer) break;
      add_card(maintainer)
    }
    lazyload();
  }

  // fire if the scroll position is 500 pixels above the bottom of the page
  function infinite_scroll() {
    var scrollHeight = $(document).height();
    var scrollPos = $(window).height() + $(window).scrollTop();
    if(((scrollHeight - 500) >= scrollPos) / scrollHeight == 0){
      console.log("loading more profiles")
      process_batch()
    }
  }
  get_ndjson('https://r-universe.dev/stats/maintainers?all=1').then(function(x){
    maintainerdata = x;
    process_batch(48);
    $(window).on("scroll", infinite_scroll);
  });
});

function add_card(maintainer){
  var orgs = maintainer.orgs.filter(org => org != maintainer.login);
  var login = maintainer.login || "";
  var profile = $("#templatezone .maintainer-profile").clone();
  var realname = (maintainer.name || "").replace(/^'(.*)'$/, '$1');
  if(login){
    profile.find(".maintainer-image").attr('data-src', 'https://r-universe.dev/avatars/' + login + ".png")
    profile.find(".maintainer-homepage").attr('href', 'https://github.com/' + login);
    profile.find(".maintainer-url").attr("href", `https://${login}.r-universe.dev`).text(realname);
  } else {
    profile.find(".maintainer-name").empty().text(realname).tooltip({title: `<${maintainer.emails[0]}> not associated with any GitHub account.`});
  }
  profile.find(".maintainer-more").append(maintainer.emails.join("<br/>"));
  profile.find(".maintainer-packages").text(maintainer.count + " packages");
  for (const org of orgs) {
    if(org == login) continue;
    if(org.includes("gitlab.com")){
      var url = "https://upload.wikimedia.org/wikipedia/commons/1/18/GitLab_Logo.svg";
    } else {
      var url = 'https://r-universe.dev/avatars/' + org + ".png?size=60";
    }
    var icon = $("<img/>").addClass("zoom lazyload maintainer-org-icon border border-light rounded m-2").attr('data-src', url).width(45);
    var orglink = $("<a/>").attr('href', 'https://' + org + '.r-universe.dev').append(icon);
    //Enable this when new api gives per-org package counts.
    //var firstname = maintainer.name.split(' ').shift();
    //var tiptext = firstname + ' maintains ' + count + " <b>" + org + "</b> package" + (count > 1 ? "s" : "");
    //orglink.tooltip({title: tiptext, html: true});
    orglink.tooltip({title: org, html: true});
    profile.find(".maintainer-organizations").append(orglink);  
  }
  profile.appendTo("#maintainer-profile-list");
}
