const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios')
const { spawn } = require('node:child_process');

let range = ''
console.log('github.ref: ', github.context.ref)
console.log('github.action: ', github.context.action)
console.log('github.payload: ', github.context.payload)

const currentTag = github.context.ref.replace('refs/tags/', '')

getTags()

function getTags() {
    let str = ''
    const tags = spawn('git', ['tag']);
    tags.stdout.on('data', data => {
        str += data
    })

    tags.stdout.on('close', data => {
        const tagsArr = str.split(`\n`)
        const currentIndex = tagsArr.findIndex(tag => tag === currentTag)
        range = (currentIndex > 0 ? `${tagsArr[currentIndex - 1]}..` : '') + currentTag
        str = ''
        getCommits()
    })

    tags.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
}

function getCommits() {
    let commits = ''
    const log = spawn('git', ['log', range, '--pretty=format:"%h %an %s"']);

    log.stdout.on('data', data => {
        commits += data
    })

    log.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    log.on('close', (code) => {
        const description = `ответственный за релиз ${github.context.actor}
        коммиты, попавшие в релиз:
        ${commits}`
        const date = new Date()
        const summary = `${currentTag} - ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
        axios({
            method: 'patch',
            url: 'https://api.tracker.yandex.net/v2/issues/HOMEWORKSHRI-130',
            data: {
                summary,
                description,
            },
            headers: {
                'X-Org-ID': core.getInput('orgid'),
                'Authorization': core.getInput('oauth')
            }
        })
        axios({
            method: 'post',
            url: 'https://api.tracker.yandex.net/v2/issues/HOMEWORKSHRI-130/comments',
            headers: {
                'X-Org-ID': core.getInput('orgid'),
                'Authorization': core.getInput('oauth')
            },
            data: {
                text: `Собрали образ с тэгом: ${currentTag}`
            }
        })
    });
}


