require("dotenv").config();

const fs = require('fs');
const api = require("commit-to-github");
const fpath = 'data/version.txt';

let version = {v: -1};

function updateVersion() {
    const n = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    version = {v: n.v+1}
    fs.writeFileSync(fpath, JSON.stringify(version));
};

function commitVersion() {
    api({
        user: process.env.USER,
        repo: process.env.REPO,
        token: process.env.GIT_TOKEN,
        files: [
            {path: fpath, content: "test"},
        ],
        fullyQualifiedRef : "heads/master",
        forceUpdate: false,
        commitMessage: "Self commit (v"+version.v+")"
    }).then(function(res){
        console.log("Self commit (v"+version.v+") -> successful.");
    }).catch(function(err){
        console.log("Self commit (v"+version.v+") -> failed.");
    })
}

updateVersion();
commitVersion();