/* Fill table */
function get_path(path){
  return new Promise(function(resolve, reject) {
    $.ajax(path).done(function(txt){
      resolve(txt);
    }).fail((jqXHR, textStatus) => reject("GET " + path + "\nHTTP "
      + jqXHR.status + "\n\n" + jqXHR.responseText));
  });
}

function get_ndjson(path){
  return get_path(path).then(txt => txt.split('\n').filter(x => x.length).map(JSON.parse));
}

function sort_packages(obj){
  return Object.keys(obj).map(function(key){return {package:key, v:obj[key]}}).sort((a, b) => (a.v > b.v) ? -1 : 1).map(x => x.package);
}

function makechart(universe, max, imsize){
  get_ndjson(`https://${universe}.r-universe.dev/stats/contributors?limit=${max || 100}&all=true`).then(function(contributors){
    const logins = contributors.map(x => x.login);
    const totals = contributors.map(x => x.total);
    const counts = contributors.map(x => sort_packages(x.contributions));
    const size = imsize || 50;
    const ctx = document.getElementById('myChart');
    $(ctx).height(logins.length * (size + 10));
    ctx.onclick = function(e){
      const pts = myChart.getElementsAtEventForMode(e, 'nearest', {intersect: true}, true);
      if(pts.length){
        const x = pts[0];
        const user = logins[x.index];
        window.open(`https://${user}.r-universe.dev`, "_blank");
      }
    };

    const myChart = new Chart(ctx, {
      type: 'bar',
      plugins: [{
        afterDraw: chart => {
          var xAxis = chart.scales.x;
          var yAxis = chart.scales.y;
          yAxis.ticks.forEach((value, index) => { 
            var y = yAxis.getPixelForTick(index);      
            var image = new Image();
            image.src = `https://r-universe.dev/avatars/${logins[index].replace('[bot]', '')}.png?size=${size}`;
            chart.ctx.drawImage(image, xAxis.left - size - 105, y - size/2, size, size);
          });
        }
      }],
      data: {
        labels: logins,
        datasets: [{
          label: 'contributions',
          data: totals,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          minBarLength: 10
        }]
      },
      options: {
        events: [], //disable all hover events, much faster (but no tooltips)
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins : {
          legend: false,
          title: {
            display: true,
            text: `Top contributors to ${universe}`
          },
          tooltip: {
            callbacks: {
              label: function(item) {
                let packages = counts[item.dataIndex];
                let len = packages.length;
                if(len > 5){
                  return ` Contributed to ${packages.slice(0,4).join(', ')} and ${packages.length-4} other packages`;
                } else if(len > 1) {
                  return ` Contributed to ${packages.slice(0,len-1).join(', ')} and ${packages[len-1]}`;
                } else {
                  return ` Contributed to ${packages[0]}`;
                }
              }
            }
          }
        },
        layout: {
          padding: {
            left: 70
          }
        },
        scales: {
          y: { 
            ticks: {
              //padding: 60,              
              beginAtZero: true,
            }
          },
          x: {
            ticks: {
              //maxRotation: 90,
              //minRotation: 90,
              display: true,
            }   
          },
        }
      }
    });
  });
}

makechart('ropensci', 20)