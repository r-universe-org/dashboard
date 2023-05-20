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

Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

Date.prototype.getWeekYear = function() {
  var date = new Date(this.getTime());
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  return date.getFullYear();
}

Date.prototype.yyyymm = function(){
  const wk = this.getWeek();
  return this.getWeekYear() + '-' + (wk < 10 ? '0' + wk : wk);
}

function sort_packages(array){
  return array.sort((a, b) => (a.count > b.count) ? -1 : 1);
}

function objectToArray(obj){
  return Object.keys(obj).map(function(key){return {package:key, count: obj[key]}});
}

function activity_data(updates){
  const now = new Date();
  const weeks = Array(53).fill(0).map((_, i) => new Date(now - i*604800000).yyyymm()).reverse();
  return weeks.map(function(weekval){
    var out = {
      year : weekval.split('-')[0],
      week : parseInt(weekval.split('-')[1])
    };
    var rec = updates.find(x => x.week == weekval);
    if(rec){
      out.total = rec.total;
      out.packages = sort_packages(objectToArray(rec.packages)).map(x => x.package);
    }
    return out;
  });
}

function make_activity_chart(universe){
  return get_ndjson(`https://${universe && universe + "." || ""}r-universe.dev/stats/updates`).then(function(updates){
    const data = activity_data(updates);
    const ctx = document.getElementById('activity-canvas');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(x => x.week),
        datasets: [{
          label: 'updates',
          data: data.map(x => x.total),
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
                const weekdata = data[item.dataIndex];
                return weekdata.year + ' week ' + weekdata.week;
              },
              label: function(item) {
                let packages = data[item.dataIndex].packages;
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
  max = max || 100;
  return get_ndjson(`https://${universe && universe + "." || ""}r-universe.dev/stats/contributors?all=true&limit=${max}`).then(function(contributors){
    const size = imsize || 50;
    contributors = contributors.sort(function(x,y){return x.repos.length < y.repos.length ? 1 : -1});
    contributors = contributors.filter(x => x.login != 'nturaga') //this is a bot from BioConductor
    const logins = contributors.map(x => x.login);
    const totals = contributors.map(x => x.repos.length);
    const counts = contributors.map(x => sort_packages(x.repos).map(x => x.upstream.split(/[\\/]/).pop()));
    const avatars = logins.map(x => `https://r-universe.dev/avatars/${x.replace('[bot]', '')}.png?size=${size}`);
    const images = avatars.map(x => undefined);
    const promises = avatars.map(download_avatar);

    function download_avatar(url, index){
      var img = new Image();
      img.src = url;
      return img.decode().then(function(x){
        images[index] = img;
      }).catch(function(e){
        console.log("Failed to load image: " + url);
      });
    }

    function render_avatars(){
      var xAxis = myChart.scales.x;
      var yAxis = myChart.scales.y;
      yAxis.ticks.forEach((value, index) => {
        var y = yAxis.getPixelForTick(index);
        var img = images[index];
        if(!img) return;
        myChart.ctx.drawImage(img, xAxis.left - size - 105, y - size/2, size, size);
      });
    }

    const ctx = document.getElementById('contributors-canvas');
    $(ctx).height(logins.length * (size + 10) + 50);
    ctx.onclick = function(e){
      const pts = myChart.getElementsAtEventForMode(e, 'nearest', {intersect: true}, true);
      if(pts.length){
        const x = pts[0];
        const user = logins[x.index];
        window.open(`https://${user}.r-universe.dev/contributors`, "_blank");
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
    // in case images were still downloading when chart was rendered
    Promise.all(promises).then(() => render_avatars());
  });
}

make_activity_chart('');
make_contributor_chart('', 50);
