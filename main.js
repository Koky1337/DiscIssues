// NOTE: Remove .git and reinitialise before publishing
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads')
const { Octokit } = require("@octokit/rest");
const differenceBy = require('lodash/differenceBy')

const Discord = require('discord.js');
const client = new Discord.Client();

// Call GitHub's API
const octokit = new Octokit({
    auth: "GITAUTH"
});



function queryGitHub(keyword, delay) {
  console.log('Checking for keyword:', keyword)
  let collectedIssues = []
  setInterval(() => {
          octokit.search.issuesAndPullRequests({
              q: `${keyword.replace(" ", "+")}+is:issue+state:open+NOT+Acunetix+NOT+syhunt+NOT+bump+NOT+upgrade+NOT+fix`,
              sort: 'created',
              order: 'desc',
              per_page: 100
          })

          .then((response) => {
            const latestCollection = response.data.items
            if (collectedIssues.length === 0) collectedIssues = latestCollection

            const newIssues = differenceBy(latestCollection, collectedIssues, 'id')
            if (newIssues.length >= 1) {
                const mapIssue = newIssues.map((issue) => {
                    return issue.html_url
                }).pop()
                console.log(mapIssue)
                client.channels.cache.get('466723055532638247').send(`New issue (${keyword}) found:\n ${mapIssue}`)
            }

            collectedIssues = collectedIssues.concat(newIssues)
          })
  }, delay)
}
const keywords = ['xss vulnerable', 'injection vulnerable', 'denial vulnerable', 'traversal vulnerable'] // MAX 20
//const keywords = ['error', 'issue'] // MAX 20
const delayLength = 60000 / 20 * keywords.length // 1 minute rate limit / 20 requests per minute * amount of keywords
if (isMainThread) {
    console.log('Main: Starting the main thread. Connecting to the bot...')

    client.on('ready', () => {
    console.log(`Connected! Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        status: "online",  //You can show online, idle....
        activity: {
            name: "for issues",  //The message shown
            type: "WATCHING" //PLAYING: WATCHING: LISTENING: STREAMING:
        }
    });
      client.channels.cache.get('466723055532638247').send('Initiated. Version 1.0.0 - Developed by k0rrupt#0394 & Koky#1337')
    });

    for (var i = 0; i < keywords.length; i++) {
        // Create a new worker, referencing own filename
        new Worker(__filename, {
            workerData: { // Pass initial data to the Worker
                keyword: keywords[i],
                delay: delayLength
            }
        })
    }
} else { // Otherwise, we are on a worker thread, do work
    queryGitHub(workerData.keyword, workerData.delay)
}

client.login('TOKEN');       
    


