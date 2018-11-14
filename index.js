require("dotenv").config();

const fs = require('fs');
const fpath = 'data/version.txt';
const request = require('request');

let version = {v: -1};

let GETheaders = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}

let POSTheaders = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/json',
    'Authorization':    'Bearer '+process.env.GIT_TOKEN
}

let latestSHA = "";

function updateVersion() {
    const n = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    version = {v: n.v+1}
    fs.writeFileSync(fpath, JSON.stringify(version));
};

function commitVersion() {

    getLatestSHA()
        .then( (sha) => getBaseTree(sha))
        .then( (tree) => postToTree(tree))
        .then( (newtree) => postToCommits(latestSHA, newtree))
        .then( (newsha) => finishCommit(newsha))
        .then( (url) => console.log(url+"\nFinished committing version "+version.v));

}

async function finishCommit(newsha) {
    let body = {
        "sha": newsha
    }

    let options = {
        url: 'https://api.github.com/repos/'+process.env.USER+'/'+process.env.REPO+'/git/refs/heads/master',
        method: "POST",
        json: true,
        body: body,
        headers: POSTheaders
    }

    let r = await thenableRequest(options);
    return r.object.url;
}

async function postToCommits(sha, newtree) {
    let body = {
        "parents": [sha],
        "tree": newtree,
        "message": "Automatic commit of version "+version.v
    }

    let options = {
        url: 'https://api.github.com/repos/'+process.env.USER+'/'+process.env.REPO+'/git/commits',
        method: "POST",
        json: true,
        body: body,
        headers: POSTheaders
    }

    let r = await thenableRequest(options);
    return r.sha;
}

async function postToTree(tree) {
    let body = {
        "base_tree": tree,
        "tree": [
          {
            "path": "data/version.txt",
            "mode": "100644",
            "type": "blob",
            "content": JSON.stringify(version) //commit sets this as content of file
          }
        ]
      }

    let options = {
        url: 'https://api.github.com/repos/'+process.env.USER+'/'+process.env.REPO+'/git/trees',
        method: "POST",
        json: true,
        body: body,
        headers: POSTheaders
    }

    let r = await thenableRequest(options);
    return r.sha;
}

async function getBaseTree(sha) {
    let options = {
        url: 'https://api.github.com/repos/'+process.env.USER+'/'+process.env.REPO+'/git/commits/'+sha,
        method: 'GET',
        headers: GETheaders
    }

    let r = await thenableRequest(options);
    return JSON.parse(r).tree.sha;
}

async function getLatestSHA() {
    let options = {
        url: 'https://api.github.com/repos/'+process.env.USER+'/'+process.env.REPO+'/git/refs/heads/master',
        method: 'GET',
        headers: GETheaders
    }

    let r = await thenableRequest(options);
    latestSHA = JSON.parse(r).object.sha;
    return latestSHA;
}

function thenableRequest(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200 && response.statusCode != 201) {
                reject('Invalid status code <' + response.statusCode + '>:\n'+JSON.stringify(response));
            }
            resolve(body);
        });
    });
}

updateVersion();
commitVersion();