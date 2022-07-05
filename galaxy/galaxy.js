$(function(){
  function rnd(max){
    return Math.floor(Math.random() * max);
  }
  get_ndjson('https://r-universe.dev/stats/universes?organization=1').then(function(x){
    const stars = $("#stars")[0];
    function order( a, b ) {
      if(a.packages.length < b.packages.length) return 1;
      if(a.packages.length > b.packages.length) return -1;
      return 0;
    }
    x.sort(order).slice(0, 250).forEach(function(org){
      var organization = org.universe;
      if(organization == 'test' || organization.includes('gitlab.com')) return;
      var size = org.packages.length;
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      var link = document.createElementNS("http://www.w3.org/2000/svg", "a");
      link.setAttributeNS(null, "href",  'https://' + organization + '.r-universe.dev');
      circle.setAttributeNS(null, "cx", rnd(100) + "%");
      circle.setAttributeNS(null, "cy", rnd(100) + "%");
      circle.setAttributeNS(null, "r",  Math.sqrt(Math.sqrt(size)));
      circle.style.animationDelay = rnd(100)/10 +"s";
      $(circle).tooltip({title: organization});
      link.appendChild(circle);
      stars.appendChild(link);
    });
  });
});
