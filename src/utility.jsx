import { xml2json } from "xml-js";

export const getDir = async (url, depth, callback) => {
  // Create an XMLHttpRequest object
  const urlPrefix = window.location.protocol + "//" + window.location.host,
    { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    webDavPrefix =
      mode === "local"
        ? "https://xarprod.ondemand.sas.com/lsaf/webdav/repo"
        : urlPrefix + "/lsaf/webdav/repo",
    // xhttp = new XMLHttpRequest(),
    options = {
      method: "PROPFIND",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Depth: "" + depth,
      },
      body:
        "<?xml version='1.0' encoding='UTF-8'?>" +
        "  <d:propfind  xmlns:d='DAV:' xmlns:sc='http://www.sas.com/sas'>" +
        "     <d:prop>" +
        "        <d:displayname /> " +
        "        <d:creationdate/> <d:getlastmodified />  <d:getetag />  <d:getcontenttype />  <d:resourcetype />  <sc:checkedOut />  <sc:locked />   <sc:version /> " +
        "     </d:prop>" +
        "  </d:propfind>",
    };
  if (mode === "local") return;
  fetch(webDavPrefix + url, options)
    .then((response) => response.text())
    .then((data) => {
      const json = JSON.parse(xml2json(data, { compact: true, spaces: 3 })),
        resp = json["d:multistatus"]["d:response"],
        dirList = [];
      for (const item of resp) {
        dirList.push(item["d:href"]._text);
      }
      callback(dirList);
    });
};

export const getJsonFile = (file, setContent) => {
  console.log("getJsonFile - file: ", file);
  fetch(file).then(function (response) {
    console.log("response", response);
    if (response.type === "cors" || response.status !== 200) return;
    response.text().then(function (text) {
      console.log("text", text);
      setContent(text);
      // TODO: use the info that comes back to modify the status of programs and outputs, which then affects the color of bars
      //  setWaitGetDir(false);
    });
  });
};
