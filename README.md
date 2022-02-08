# Dashboard

This dashboard is automatically deployed on `https://r-universe.dev` and `https://{user}.r-universe.dev` domains.

## Debugging

The dashboard consists only of static html/js and can be debugged locally simply by opening the html files in your browser. For example to debug the https://r-universe.dev/maintainers/ site, just edit and open these files:

 - [maintainers/index.html](maintainers/index.html)
 - [maintainers/maintainers.js](maintainers/maintainers.js)

One special case: the dashboard from a r-universe subdomain such as https://ropensci.r-universe.dev is contained in these files:

 - [homepage.html](homepage.html)
 - [homepage/homepage.js](homepage/homepage.js)

When you open [homepage.html](homepage.html) locally in your browser (i.e. not on a proper r-universe subdomain), the code will use data from the universe that is defined in the `devtest` variable at the bottom of [homepage/homepage.js](homepage/homepage.js):

```js
//INIT
var devtest = 'ropensci'
```

So to debug the dashboard with e.g. user `tidyverse`, you can set `devtest` variable to `'tidyverse'`, and then simply open [homepage.html](homepage.html) in your local browser. This will show the dashboard that you would see for `https://tidyverse.r-universe.dev`.
