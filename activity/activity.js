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

function sort_packages(array){
  return array.sort((a, b) => (a.count > b.count) ? -1 : 1);
}

function objectToArray(obj){
  return Object.keys(obj).map(function(key){return {package:key, count: obj[key]}});
}

function make_activity_chart(universe){
  return get_ndjson(`https://${universe && universe + "." || ""}r-universe.dev/stats/updates`).then(function(updates){
    updates.shift();
    const weeks = updates.map(x => parseInt(x.week.split('-')[1]));
    const years = updates.map(x => x.week.split('-')[0]);
    const counts = updates.map(x => sort_packages(objectToArray(x.packages)).map(x => x.package));
    const ctx = document.getElementById('activity-canvas');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [{
          label: 'updates',
          data: updates.map(x => x.total),
          backgroundColor: 'rgb(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins : {
          legend: false,
          title: {
            display: true,
            text: "Weekly package updates"
          },
          tooltip: {
            callbacks: {
              title: function(items){
                const item = items[0];
                return years[item.dataIndex] + ' week ' + item.label; 
              },
              label: function(item) {
                let packages = counts[item.dataIndex];
                let len = packages.length;
                if(len > 5){
                  return ` Updates in ${packages.slice(0,4).join(', ')} and ${packages.length-4} other packages`;
                } else if(len > 1) {
                  return ` Updates in ${packages.slice(0,len-1).join(', ')} and ${packages[len-1]}`;
                } else {
                  return ` Updates in ${packages[0]}`;
                }
              }
            }
          }
        },
        layout: {
          padding: 20
        },
      }
    });
  });
}

function make_contributor_chart(universe, max, imsize){
  return get_ndjson(`https://${universe && universe + "." || ""}r-universe.dev/stats/contributors?limit=${max || 100}`).then(function(contributors){
    const size = imsize || 50;
    const logins = contributors.map(x => x.login);
    const totals = contributors.map(x => x.total);
    const counts = contributors.map(x => sort_packages(x.repos).map(x => x.upstream.split(/[\\/]/).pop()));
    const avatars = logins.map(x => `https://r-universe.dev/avatars/${x.replace('[bot]', '')}.png?size=${size}`);
    const images = avatars.map(function(url){
      var image = new Image();
      image.src = url;
      return image;
    });

    function render_avatars(){
      var xAxis = myChart.scales.x;
      var yAxis = myChart.scales.y;
      yAxis.ticks.forEach((value, index) => {
        var y = yAxis.getPixelForTick(index);
        myChart.ctx.drawImage(images[index], xAxis.left - size - 105, y - size/2, size, size);
      });
    }

    const ctx = document.getElementById('contributors-canvas');
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
//        afterDraw: render_avatars
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
        //events: [], //disable all hover events, much faster (but no tooltips)
        animation : {
          onComplete: render_avatars,
          onProgress: render_avatars
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins : {
          legend: false,
          title: {
            display: true,
            text: `Top contributors ${universe  ? "to " + universe : "(overall)"}`
          },
          tooltip: {
            animation: false,
            callbacks: {
              label: function(item) {
                let packages = counts[item.dataIndex];
                let len = packages.length;
                if(len > 5){
                  return ` Contributed to ${packages.slice(0,4).join(', ')} and ${packages.length-4} other projects`;
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

make_activity_chart('');
make_contributor_chart('', 50);
