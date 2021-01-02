const fs = require('fs')
const moment = require('moment')
var CronJob = require('cron').CronJob
const util = require('util')
const exec = util.promisify(require('child_process').exec)

async function loadIptables(){

    const savedIps = new Set()
    const command = `iptables -L | grep DROP`
    const { stdout, stderr } = await exec(command)
    if(stderr){
        console.log('Error:', stderr)
    }
    const tmp = stdout.split('\n')
    tmp.forEach(f => {
        const ip = f.split('  ')[5]
        //console.log(ip)
        if(ip && ip.length > 0){
            savedIps.add(ip)
        }
    })
    return savedIps
}

async function filterIps(savedIps){
    const result = fs.readFileSync('/var/log/auth.log', 'utf-8')
    
    const lines = result.split('\n')
    .filter(f => {
        const day = moment().format('DD')
        return f.indexOf('Invalid') != -1 && f.split(' ')[1].indexOf(day) != -1 
    })

    const ips = new Set()

    lines.forEach(l => {
        const ip = l.split(' ')[9]
        if(!savedIps.has(ip)){
            ips.add(ip)
        }
    })
    console.log(ips)
    return ips.values()
}

async function addRule(ip){
    const command = `iptables -A INPUT -s ${ip} -j DROP`
    const { stdout, stderr } = await exec(command)
    if(stderr){
        console.log('Error:', stderr)
    }    
}

// var job = new CronJob('0 0 */1 * * *', function() {
// //var job = new CronJob('0 */1 * * * *', function() {
//     console.log('Running...')
//     init().then().catch(e => {console.log(e)})
//   }, null, true, null)
// job.start();


async function init(){

    const savedIps = await loadIptables()
    console.log(savedIps)    
    const ips = await filterIps(savedIps)
    
    for (const key in ips) {
        const ip = ips[key]
        await addRule(ip)
    }
}

init().then().catch(e => {console.log(e)})