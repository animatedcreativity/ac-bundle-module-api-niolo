exports = module.exports = exports = module.exports = function() {
  var mod = {
    token: async function() {
      if (app.has(mod.jwt) && new Date().getTime() - mod.time > 120000) return mod.jwt;
      var result = await fetch(config.niolo.endpoint + "/auth/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          identifier: config.niolo.username,
          password: config.niolo.password
        })
      });
      if (result.status === 200) {
        var json = await result.json();
        if (app.has(json.jwt)) {
          mod.time = new Date().getTime();
          mod.jwt = json.jwt;
          return json.jwt;
        }
      }
    },
    requestCallback: async function(callback, errorCallback, url, method, data, page) {
      if (!(app.has(method))) method = "GET";
      if (!(app.has(page))) page = 1;
      var token = await mod.token();
      var fetchUrl = config.niolo.endpoint + url + "?_start=" + ((page - 1) * 100) + "&_limit=100";
      console.log(method, fetchUrl);
      var result = await fetch(fetchUrl, {
        method: method,
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      });
      if (result.status === 200) {
        var json = await result.json();
        if (typeof callback === "function") {
          var cResult = await callback(json);
          if (json.length === 100 && app.has(cResult) && app.has(cResult.length)) {
            await mod.requestCallback(callback, errorCallback, url, method, data, page + 1);
          }
        }
      } else {
        if (typeof errorCallback === "function") errorCallback("Could not load " + url + " from niolo.", await result.text());
      }
    }
  };
  return mod;
}